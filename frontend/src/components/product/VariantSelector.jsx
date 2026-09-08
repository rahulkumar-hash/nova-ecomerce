import React from "react";

export default function VariantSelector({
  attributeOptions = [],
  variants = [],
  selectedAttributes = {},
  onSelectAttribute,
}) {
  // Extract dynamic attributeOptions from variants if not passed directly
  let options = Array.isArray(attributeOptions) ? [...attributeOptions] : [];
  if (options.length === 0 && Array.isArray(variants)) {
    const map = {};
    variants.forEach((v) => {
      if (Array.isArray(v.attributes)) {
        v.attributes.forEach((a) => {
          if (!map[a.name]) map[a.name] = new Set();
          map[a.name].add(a.value);
        });
      }
    });
    options = Object.entries(map).map(([name, set]) => ({
      name,
      values: Array.from(set),
    }));
  }

  if (options.length === 0) return null;

  return (
    <div className="space-y-4 py-2">
      {options.map((option) => (
        <div key={option.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {option.name}: <span className="font-semibold text-slate-600 dark:text-slate-400 normal-case">{selectedAttributes[option.name] || "Select"}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Array.isArray(option.values) ? option.values : []).map((val) => {
              const isSelected = selectedAttributes[option.name] === val;

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onSelectAttribute(option.name, val)}
                  className={"px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border " + (isSelected ? "border-primary bg-primary text-white shadow-md" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600")}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
