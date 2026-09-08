import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { Order } from "../Order/order.model.js";
import {
  getAvailableCouriersForOrder,
  assignCourierAndDispatch,
  testProviderConnection,
} from "../../services/shipping/shippingService.js";

/**
 * Check available courier partners and rates for an order based on dimensions & weight
 */
export const checkCourierRates = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  let query = { orderNumber: orderId };
  if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: orderId }, { orderNumber: orderId }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const packageDetails = req.body || {};
  const ratesResult = await getAvailableCouriersForOrder(order, packageDetails);

  return res.status(200).json(
    new ApiResponse(200, ratesResult, "Available courier partners fetched successfully")
  );
});

/**
 * Assign chosen courier partner, generate AWB and dispatch order
 */
export const assignCourierAndShip = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { courier, packageDetails } = req.body;

  if (!courier || !courier.name) {
    throw new ApiError(400, "Please select a courier partner");
  }

  let query = { orderNumber: orderId };
  if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: orderId }, { orderNumber: orderId }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const dispatchResult = await assignCourierAndDispatch(order, courier, packageDetails || {});

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        order,
        dispatchResult,
      },
      dispatchResult.message
    )
  );
});

/**
 * Test connectivity for a given delivery provider from admin settings
 */
export const testDeliveryConnection = asyncHandler(async (req, res) => {
  const { provider, credentials } = req.body;

  if (!provider) {
    throw new ApiError(400, "Provider is required");
  }

  const result = await testProviderConnection(provider, credentials || {});
  return res.status(200).json(new ApiResponse(200, result, result.message));
});
