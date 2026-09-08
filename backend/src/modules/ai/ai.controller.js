import { aiTools } from "./aiTools.js";
import { parseLocalAdminIntent } from "./localIntentParser.js";
import { callGeminiCopilot } from "./geminiService.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// List of tools that modify database state and need confirmation by default
const DESTRUCTIVE_TOOLS = [
  "createProduct",
  "deleteProduct",
  "deleteCoupon",
  "updateProductStock",
  "updateProductPrice",
  "toggleProductStatus",
  "updateOrderStatus",
  "manageReturnRequest",
  "createDiscountCoupon",
  "answerCustomerQuestion",
  "updateAnnouncementBar",
];

export const handleAiCommand = async (req, res) => {
  try {
    const {
      prompt,
      executeAction,
      confirmedTool,
      confirmedParams,
      apiKeyOverride,
      conversationHistory = [],
    } = req.body;

    // 1. Direct Execution Trigger from User Confirmation Card Click
    if (executeAction && confirmedTool && aiTools[confirmedTool]) {
      const toolFn = aiTools[confirmedTool];
      const result = await toolFn(confirmedParams || {});

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            executed: true,
            toolName: confirmedTool,
            data: result,
            message: result.message || "Action executed successfully.",
            mode: "executed",
          },
          "Command executed successfully"
        )
      );
    }

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ success: false, message: "A valid prompt is required." });
    }

    // 1b. Check if user typed "ok", "k", "yes", "confirm", "haan", "proceed" in response to a pending confirmation card
    const isAffirmative = /^(k|ok|yes|yep|yeah|confirm|haan|han|done|proceed|kardo|kar do|update karo|update kar do|execute|sure)$/i.test(prompt.trim());
    if (isAffirmative && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const pendingMsg = [...conversationHistory].reverse().find((m) => {
        const t = m.confirmedTool || m.toolName;
        return m.requiresConfirmation && t && aiTools[t];
      });

      if (pendingMsg) {
        const targetTool = pendingMsg.confirmedTool || pendingMsg.toolName;
        const targetParams = pendingMsg.confirmedParams || pendingMsg.params || {};
        const toolFn = aiTools[targetTool];
        const result = await toolFn(targetParams);
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              executed: true,
              toolName: targetTool,
              data: result,
              message: result.message || result.summary || "Action executed successfully.",
              mode: "executed",
            },
            "Action executed via affirmative response"
          )
        );
      }
    }

    const apiKey =
      apiKeyOverride ||
      req.headers["x-gemini-key"] ||
      process.env.GEMINI_API_KEY ||
      null;

    let parsedResult = null;
    let engineMode = "local";

    // 2. Try Gemini 2.0 Mode if API key is present
    if (apiKey) {
      try {
        const geminiResp = await callGeminiCopilot({
          prompt,
          apiKey,
          conversationHistory,
        });

        if (geminiResp.hasFunctionCall && aiTools[geminiResp.toolName]) {
          let promptDesc = `Are you sure you want to execute **${geminiResp.toolName}**?`;
          let friendlyGoal = `Action: ${geminiResp.toolName}`;

          if (geminiResp.toolName === "createProduct") {
            const p = geminiResp.params || {};
            promptDesc = `Create new product **"${p.name || "New Item"}"** (${p.brand || "Brand"}) at **₹${p.price || 0}** (MRP: ₹${p.mrp || 0})?`;
            friendlyGoal = `Add new product "${p.name || "Product"}" to catalog`;
          } else if (geminiResp.toolName === "deleteProduct") {
            const p = geminiResp.params || {};
            promptDesc = `Are you sure you want to delete product matching **"${p.query}"** from catalog?`;
            friendlyGoal = `Delete product ${p.query}`;
          } else if (geminiResp.toolName === "deleteCoupon") {
            const p = geminiResp.params || {};
            promptDesc = `Are you sure you want to delete coupon **"${p.code}"**?`;
            friendlyGoal = `Delete coupon ${p.code}`;
          }

          parsedResult = {
            toolName: geminiResp.toolName,
            params: geminiResp.params || {},
            userFriendlyGoal: friendlyGoal,
            requiresConfirmation: DESTRUCTIVE_TOOLS.includes(geminiResp.toolName),
            confirmationPrompt: promptDesc,
          };
          engineMode = "gemini";
        } else if (geminiResp.text) {
          // Gemini gave conversational text or refusal
          return res.status(200).json(
            new ApiResponse(
              200,
              {
                executed: false,
                requiresConfirmation: false,
                message: geminiResp.text,
                mode: "gemini",
              },
              "Gemini response"
            )
          );
        }
      } catch (geminiErr) {
        console.warn("[Admin Copilot] Gemini API error, falling back to Local Engine:", geminiErr.message);
        // Fallback to local
      }
    }

    // 3. Built-in Local Hybrid Engine
    if (!parsedResult) {
      parsedResult = parseLocalAdminIntent(prompt);
      engineMode = "local";
    }

    // 4. Check for Out-of-Scope Refusal
    if (parsedResult.isRefusal) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            isRefusal: true,
            executed: false,
            message: parsedResult.message,
            mode: engineMode,
          },
          "Out-of-scope query rejected"
        )
      );
    }

    const { toolName, params, requiresConfirmation, confirmationPrompt, userFriendlyGoal } = parsedResult;

    if (!toolName || !aiTools[toolName]) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            executed: false,
            message: "Could not map to a recognized store operation tool. Please check your command.",
            mode: engineMode,
          },
          "Unknown tool"
        )
      );
    }

    // Check if user explicitly bypassed confirmation (e.g. prompt includes "confirm" or "force")
    const isExplicitlyConfirmed = /\b(confirm|force|bina pooche|kardo abhi|direct)\b/i.test(prompt);

    // 5. If Destructive and Not Explicitly Confirmed -> Return Proposal Card
    if (requiresConfirmation && !isExplicitlyConfirmed) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            requiresConfirmation: true,
            confirmationPrompt:
              confirmationPrompt ||
              `Please confirm: Do you want to execute **${toolName}** with parameters: ${JSON.stringify(params)}?`,
            toolName,
            params,
            confirmedTool: toolName,
            confirmedParams: params,
            userFriendlyGoal: userFriendlyGoal || toolName,
            mode: engineMode,
          },
          "Confirmation required"
        )
      );
    }

    // 6. Execute Tool Safe Server-Side
    const toolFn = aiTools[toolName];
    const data = await toolFn(params);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          executed: true,
          requiresConfirmation: false,
          toolName,
          params,
          data,
          message: data.message || data.summary || "Operation completed successfully.",
          mode: engineMode,
        },
        "Command executed successfully"
      )
    );
  } catch (error) {
    console.error("[Admin Copilot Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process AI command.",
    });
  }
};
