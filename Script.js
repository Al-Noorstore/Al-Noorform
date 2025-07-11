document.addEventListener('DOMContentLoaded', () => {
    // Get URL parameters (e.g., ?product_id=PROD001&product_name=Face%20Cream&product_price=2500)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product_id');
    const productName = urlParams.get('product_name');
    const productPrice = urlParams.get('product_price'); // This is the unit price from URL
    const productImageUrl = urlParams.get('product_image_url');

    // Get elements for displaying and interacting with product info
    const productDisplay = document.getElementById('product-display');
    const displayProductName = document.getElementById('displayProductName');
    const displayProductPrice = document.getElementById('displayProductPrice');
    const productQuantityInput = document.getElementById('productQuantity');
    const decreaseQuantityBtn = document.getElementById('decreaseQuantity');
    const increaseQuantityBtn = document.getElementById('increaseQuantity');
    const finalPriceInput = document.getElementById('finalPrice'); // Hidden field for total price

    // Get hidden form fields to store product info for submission
    const formProductId = document.getElementById('form-product-id');
    const formProductName = document.getElementById('form-product-name');
    const formProductUnitPrice = document.getElementById('form-product-price'); // Hidden field for unit price
    const formProductImageUrl = document.getElementById('form-product-image-url');
    const orderForm = document.getElementById('order-form');
    const submissionStatus = document.getElementById('submission-status');

    let unitPrice = parseFloat(productPrice) || 0; // Parse unit price from URL

    // Function to update total price based on quantity
    function updateTotalPrice() {
        const quantity = parseInt(productQuantityInput.value);
        const totalPrice = unitPrice * quantity;
        displayProductPrice.value = `PKR ${unitPrice.toLocaleString('en-PK')} (Total: PKR ${totalPrice.toLocaleString('en-PK')})`;
        finalPriceInput.value = totalPrice; // Store calculated total price in hidden field
    }

    if (productName && productPrice) {
        // Clear the placeholder message if it exists
        productDisplay.querySelector('.placeholder-message')?.remove();

        // Display product info to the user in the summary box
        let displaySummaryHtml = `
            ${productImageUrl ? `<img src="${productImageUrl}" alt="${productName}">` : ''}
            <div>
                <p><strong>You are ordering:</strong></p>
                <p><strong>Product:</strong> ${productName}</p>
                <p><strong>Unit Price:</strong> PKR ${unitPrice.toLocaleString('en-PK')}</p>
            </div>
        `;
        productDisplay.innerHTML = displaySummaryHtml;

        // Auto-fill product name and unit price into the form fields
        displayProductName.value = productName;
        productQuantityInput.value = 1; // Default quantity

        // Set hidden form field values, which will be submitted
        formProductId.value = productId || '';
        formProductName.value = productName;
        formProductUnitPrice.value = unitPrice; // Store unit price here
        formProductImageUrl.value = productImageUrl || '';

        // Initial total price calculation
        updateTotalPrice();

        // Event listeners for quantity buttons
        decreaseQuantityBtn.addEventListener('click', () => {
            let quantity = parseInt(productQuantityInput.value);
            if (quantity > 1) {
                productQuantityInput.value = quantity - 1;
                updateTotalPrice();
            }
        });

        increaseQuantityBtn.addEventListener('click', () => {
            let quantity = parseInt(productQuantityInput.value);
            productQuantityInput.value = quantity + 1;
            updateTotalPrice();
        });

        // Form submission handler for Supabase API
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission

            submissionStatus.textContent = 'Submitting order...';
            submissionStatus.style.color = 'orange';

            const formData = new FormData(e.target);

            // Construct order details for the payload
            const orderProducts = [{
                product_id: formProductId.value,
                product_name: formProductName.value,
                quantity: parseInt(productQuantityInput.value),
                unit_price: parseFloat(formProductUnitPrice.value),
                total_item_price: parseFloat(finalPriceInput.value),
                image_url: formProductImageUrl.value
            }];

            const payload = {
                form_type: 'local',
                form_name: 'website-order', // You can change this name if you like
                customer_name: formData.get('customerName'),
                customer_email: formData.get('customerEmail'),
                customer_phone: formData.get('customerPhone'),
                delivery_address: formData.get('deliveryAddress'),
                delivery_city: formData.get('deliveryCity'),
                // delivery_postal_code: formData.get('deliveryPostalCode'), // Add this if you add a postal code field
                delivery_province: formData.get('deliveryProvince'), // Added province
                payment_method: formData.get('paymentMethod'), // Added payment method
                order_notes: formData.get('orderNotes'), // Added order notes
                order_details: { products: orderProducts } // Structured product details
            };

            try {
                const response = await fetch('https://osrolxzvnurzisusv.supabase.co/functions/v1/submit-form', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json(); // If your function returns JSON
                    submissionStatus.textContent = 'Order submitted successfully! We will contact you soon.';
                    submissionStatus.style.color = 'green';
                    orderForm.reset(); // Clear the form after successful submission
                    // Reset product display and quantity to initial state
                    productDisplay.innerHTML = `<p class="placeholder-message">Loading product details... Please use the "Buy Now" button from the main store.</p>`;
                    productQuantityInput.value = 1;
                    displayProductName.value = '';
                    displayProductPrice.value = '';
                    finalPriceInput.value = '';
                } else {
                    const errorText = await response.text();
                    submissionStatus.textContent = `Order submission failed: ${response.status} ${response.statusText}. Please try again or contact support.`;
                    submissionStatus.style.color = 'red';
                    console.error('Error submitting form:', response.status, response.statusText, errorText);
                }
            } catch (error) {
                submissionStatus.textContent = 'An error occurred during submission. Please check your internet connection.';
                submissionStatus.style.color = 'red';
                console.error('Network error or unexpected issue:', error);
            }
        });

    } else {
        // Show placeholder message and disable form if no product info
        productDisplay.innerHTML = `
            <p class="placeholder-message">
                <span style="color: red; font-weight: bold;">Error: Product information missing.</span><br>
                Please return to the <a href="https://lovable.dev/projects.vercel.app/" target="_parent" style="color: var(--primary-orange); text-decoration: none;">Al-Noor Store</a> and use the "Buy Now" button to place an order.
            </p>
        `;
        document.querySelector('button[type="submit"]').disabled = true;
        // Also disable quantity controls if no product is loaded
        if(displayProductName) displayProductName.disabled = true;
        if(displayProductPrice) displayProductPrice.disabled = true;
        if(productQuantityInput) productQuantityInput.disabled = true;
        if(decreaseQuantityBtn) decreaseQuantityBtn.disabled = true;
        if(increaseQuantityBtn) increaseQuantityBtn.disabled = true;
    }
});
