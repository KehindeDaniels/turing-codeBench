Summary of Changes

- Changed from using array of products to object keyed by product name to help simplify lookup and avoid multiple iterations
- Updated the `sellItems()` function to handle expired batches by merging them back into the inventory after selling
- Modified the `getStock()` function to calculate the total quantity by summing quantities from all batches, including expired ones

