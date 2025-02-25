This incorrect implementation failed for many reasons
- It fails to meet the task requirement because it does not throw an error when an invalid coupon code is provided
- There is no check for the supported payment methods mentioned in the prompt, so if an unsupported method is used, the function runs without error
- The code is stimulating payment this way
```javascript
const paymentValid = true;
if (!paymentValid) {
  throw new Error('Payment validation failed');
}
```
And since the `paymentValid` is hardcoded to `true`, it will never throw an error as expected for invalid method
- The current `shipOrder` methods checks the order that
```javascript
if (order.items.some(item => this.restrictedItems.includes(item.itemName))) {
  throw new Error('Order contains restricted items');
}
```
The code incorrectly applies the restricted items check regardless of country. The check should only be applied for international orders
- The loyalty points calculation is not being performed in the correct phase after payment or with the correct final amount
- The current implementation only adds loyalty points with the `applyLoyaltyPoints` but does not provide any logic to redeem loyalty points for a discount on subsequent orders.So, when the test attempts to process a payment for an order where the customer should redeem points, the order total remains unchanged, and the payment validation fails with the error "Payment amount does not match the order total"




## COrrect
- Instead of performing all the calculations using hardcoded USD values without converting to the order’s currency. In the ideal response, it converts item prices from USD to the order’s currency using provided exchange rates and applies coupon discounts (including a conversion for FIXED50) and calculates a detailed subtotal, tax, and a rounded final total
- The ideal solution supports both percentage (10OFF) and fixed ($50, converted appropriately) discounts, automatically applies a $10 loyalty discount which is also converted to order currency if a customer has at least 100 points, and then deducts those points. whereas, in the incorrect solution, it only calculates the discount based on the coupon without any currency conversion
-The ppayment process now validates that the payment method is either “Credit Card” or “PayPal” and explicitly rejects any unsuported method
- it allows shipping only for paid orders and only prevents restricted items from being shipped if the destination is international
