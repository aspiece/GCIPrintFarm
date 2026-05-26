/**
 * Shared pricing helper for invoice and request estimate calculations.
 */
(function (global) {
  'use strict';

  var RATES = {
    serviceRatePerHour: 1.5,
    setupFee: 2.0,
    materialRatePerKg: 20.0,
    salesTaxRate: 0.06,
    designFee: 5.0
  };

  function toNumber(value, fallback) {
    var n = parseFloat(value);
    return Number.isFinite(n) ? n : (fallback || 0);
  }

  function toQuantity(value) {
    var q = parseInt(value, 10);
    return Number.isFinite(q) && q > 0 ? q : 1;
  }

  function calculate(input) {
    var printTimeHours = Math.max(0, toNumber(input && input.printTimeHours, 0));
    var filamentGrams = Math.max(0, toNumber(input && input.filamentGrams, 0));
    var quantity = toQuantity(input && input.quantity);
    var includeDesignFee = !!(input && input.includeDesignFee);
    var taxExempt = !!(input && input.taxExempt);

    var printTimeCostPerItem = printTimeHours * RATES.serviceRatePerHour;
    var setupFeePerItem = RATES.setupFee;
    var materialCostPerItem = (filamentGrams / 1000) * RATES.materialRatePerKg;
    var designFeePerItem = includeDesignFee ? RATES.designFee : 0;

    var machineCost = (printTimeCostPerItem + setupFeePerItem) * quantity;
    var materialCost = materialCostPerItem * quantity;
    var additionalFees = designFeePerItem * quantity;
    var subtotal = machineCost + materialCost + additionalFees;
    var salesTax = taxExempt ? 0 : (materialCost * RATES.salesTaxRate);
    var total = subtotal + salesTax;

    return {
      inputs: {
        printTimeHours: printTimeHours,
        filamentGrams: filamentGrams,
        quantity: quantity,
        includeDesignFee: includeDesignFee,
        taxExempt: taxExempt
      },
      breakdown: {
        machineCost: machineCost,
        materialCost: materialCost,
        additionalFees: additionalFees,
        subtotal: subtotal,
        salesTax: salesTax,
        total: total
      },
      perItem: {
        printTimeCost: printTimeCostPerItem,
        setupFee: setupFeePerItem,
        materialCost: materialCostPerItem,
        designFee: designFeePerItem
      },
      rates: RATES
    };
  }

  global.PrintPricing = {
    RATES: RATES,
    calculate: calculate
  };
}(window));
