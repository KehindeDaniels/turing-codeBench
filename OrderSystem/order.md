Help me complete this Order System, it should support different country currency (for USA, Germany and Nigeria alone), discounts, tax calculations, and even have a loyalty program. The system should be able to:

1. Place and Validate Orders

- Orders must have `orderId`, `customerName`, `items`, `currency`, `country`, and `status`.
- Apply coupon discounts if a `couponCode` is provided.
- `'10OFF'` reduces the total price by 10%.
- `'FIXED50'` reduces the total price by $50.
- Calculate tax based on the country; USA(5% tax), Germany(19% tax), Nigeria(7.5% tax)
- Ensure currency is supported, and prices are converted based on exchange rates
- Throw an error if an invalid coupon or currency is used.

2. Process Payments with a Payment Gateway

- Payments should only be processed in the order’s currency
- Simulate third-party payment validation before accepting payments
- Ensure the paid amount matches the final order total after tax and discounts
- If payment validation fails, the order should remain unpaid

3. Shipping Orders

- Orders can only be shipped if they are paid
- Restricted items cannot be shipped internationally
- Create a shipment record when an order is shipped
- Shipping details should include `trackingNumber`, `carrier`, `estimatedDelivery` date in YYYY-MM-DD format

4. Tracking Shipments

- `trackShipment(orderId)` should return the shipping status and estimated delivery

5. Order Cancellation & Refunds

- Unpaid orders can be canceled freely.
- Paid orders must follow refund policy
- Full refund if canceled within 24 hours.
- 50% refund if canceled after 24 hours but before shipping.
- No refund once the order is shipped.

6. Loyalty Program
- Customers earn loyalty points based on total spending
  - Earn 1 point per $10 spent
  - Points are stored per customer
- Customers can redeem loyalty points for discounts
  - 100 points = $10 discount on future purchases.
  - Points can only be used if a customer has at least 100 points.
- Ensure loyalty points are calculated after applying coupons and tax.

7. Error Handling
- Prevent duplicate orders
- Ensure valid currency, country, and payment details
- Prevent shipping of restricted items internationally

8. Scalability
- Handle thousands of orders efficiently.
- Ensure the system can process real-time payment gateway verification

Example Usage
```javascript
const { OrderProcessingSystem } = require("./OrderProcessingSystem");
const system = new OrderProcessingSystem();

system.placeOrder({
  orderId: "ORD123",
  customerName: "John Doe",
  items: [
    { itemName: "Laptop", quantity: 1, price: 1000 },
    { itemName: "Mouse", quantity: 2, price: 50 },
  ],
  currency: "USD",
  country: "USA",
  couponCode: "10OFF", // 10% discount
});

system.processPayment("ORD123", {
  paymentMethod: "Credit Card",
  transactionId: "TXN456",
  amount: 990, // $1100 - 10% discount
});

system.shipOrder("ORD123", {
  trackingNumber: "TRK789",
  carrier: "FedEx",
  estimatedDelivery: "2025-05-10",
});

console.log(system.trackShipment("ORD123"));
console.log(system.getOrderSummary("ORD123"));
console.log(system.getLoyaltyPoints("John Doe"));
```
