document.addEventListener('DOMContentLoaded', function() {
    // Get the category button and dropdown elements
    const categoryBtn = document.getElementById('categoryBtn');
    const categoryDropdown = document.getElementById('categoryDropdown');

    // Toggle dropdown when clicking the button
    categoryBtn.addEventListener('click', function() {
        categoryDropdown.style.display = categoryDropdown.style.display === 'block' ? 'none' : 'block';
    });

    // Close the dropdown when clicking outside
    window.addEventListener('click', function(event) {
        if (!event.target.matches('#categoryBtn') && !event.target.closest('#categoryDropdown')) {
            categoryDropdown.style.display = 'none';
        }
    });

    // Get all product sections
    const productSections = document.querySelectorAll('.product-section');
    
    productSections.forEach(section => {
        const productsContainer = section.querySelector('.products-container');
        
        // Set up horizontal scrolling without navigation arrows
        if (productsContainer) {
            // Enable smooth drag scrolling for mobile and desktop
            let isDown = false;
            let startX;
            let scrollLeft;

            productsContainer.addEventListener('mousedown', (e) => {
                isDown = true;
                productsContainer.style.cursor = 'grabbing';
                startX = e.pageX - productsContainer.offsetLeft;
                scrollLeft = productsContainer.scrollLeft;
                e.preventDefault();
            });

            productsContainer.addEventListener('mouseleave', () => {
                isDown = false;
                productsContainer.style.cursor = 'grab';
            });

            productsContainer.addEventListener('mouseup', () => {
                isDown = false;
                productsContainer.style.cursor = 'grab';
            });

            productsContainer.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - productsContainer.offsetLeft;
                const walk = (x - startX) * 2; // Scroll speed
                productsContainer.scrollLeft = scrollLeft - walk;
            });
            
            // Ensure all product cards within a container have equal height
            const productCards = productsContainer.querySelectorAll('.product-card');
            let maxHeight = 0;
            
            // Find the tallest card
            productCards.forEach(card => {
                const cardHeight = card.offsetHeight;
                if (cardHeight > maxHeight) {
                    maxHeight = cardHeight;
                }
            });
            
            // Set all cards to the same height
            productCards.forEach(card => {
                card.style.height = `${maxHeight}px`;
            });
        }
    });
    
    // Cart functions
    // Load cart from localStorage if available
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    let cartCount = 0;
    
    // Function to initialize all Add buttons
    function initializeAddButtons() {
        // Find all Add buttons in the document
        const addButtons = document.querySelectorAll('.add-btn');
        
        // First, remove all event listeners by cloning and replacing each button
        addButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            newButton.innerHTML = 'Add';
            newButton.classList.remove('quantity-active');
            button.parentNode.replaceChild(newButton, button);
            
            // Now add fresh event listeners to the new button
            newButton.addEventListener('click', handleAddButtonClick);
        });
    }
    
    // Function to handle Add button clicks
    function handleAddButtonClick(event) {
        const button = event.currentTarget;
        
        // Only proceed if button is not already in quantity mode
        if (!button.classList.contains('quantity-active')) {
            // Change the button to quantity controls
            activateQuantityMode(button);
        }
    }
    
    // Function to activate quantity mode on a button
    function activateQuantityMode(button) {
        // Save original button text
        button.dataset.originalText = button.innerHTML;
        
        // Add quantity-active class
        button.classList.add('quantity-active');
        
        // Set the HTML for quantity controls
        button.innerHTML = `
            <span class="qty-btn minus">−</span>
            <span class="qty-value">1</span>
            <span class="qty-btn plus">+</span>
        `;
        
        // Get the product info and add to cart
        const productInfo = getProductInfo(button);
        addToCart({
            name: productInfo.name,
            price: productInfo.price,
            quantity: 1,
            weight: productInfo.weight,
            image: productInfo.image
        });
        
        // Add event listeners to the quantity controls
        const minusBtn = button.querySelector('.qty-btn.minus');
        const plusBtn = button.querySelector('.qty-btn.plus');
        
        // Remove existing listeners if any
        minusBtn.removeEventListener('click', handleMinusClick);
        plusBtn.removeEventListener('click', handlePlusClick);
        
        // Add new listeners with the button reference
        minusBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleMinusClick(e, button);
        });
        
        plusBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handlePlusClick(e, button);
        });
    }
    
    // Function to handle clicks on the minus button
    function handleMinusClick(event, button) {
        const qtyValue = button.querySelector('.qty-value');
        let qty = parseInt(qtyValue.textContent);
        
        if (qty > 1) {
            // Decrease quantity
            qty--;
            qtyValue.textContent = qty;
            
            // Update cart
            const productInfo = getProductInfo(button);
            updateCartItemQuantity(productInfo.name, qty);
        } else {
            // Reset to original state
            deactivateQuantityMode(button);
            
            // Remove from cart
            const productInfo = getProductInfo(button);
            removeFromCart(productInfo.name);
        }
    }
    
    // Function to handle clicks on the plus button
    function handlePlusClick(event, button) {
        const qtyValue = button.querySelector('.qty-value');
        let qty = parseInt(qtyValue.textContent);
        
        // Increase quantity
        qty++;
        qtyValue.textContent = qty;
        
        // Update cart
        const productInfo = getProductInfo(button);
        updateCartItemQuantity(productInfo.name, qty);
    }
    
    // Function to reset a button back to Add state
    function deactivateQuantityMode(button) {
        button.classList.remove('quantity-active');
        button.innerHTML = button.dataset.originalText || 'Add';
    }
    
    // Function to get product info from a button's parent card
    function getProductInfo(button) {
        const card = button.closest('.product-card');
        
        if (!card) {
            console.error("Could not find product card");
            return { name: "Unknown", price: "0", weight: "0", image: "" };
        }
        
        const name = card.querySelector('.product-name')?.textContent || "Unknown";
        const price = card.querySelector('.current-price')?.textContent || "0";
        const weight = card.querySelector('.weight-selector select')?.value || "Unknown";
        const image = card.querySelector('.product-image img')?.src || "";
        const originalPrice = card.querySelector('.original-price')?.textContent || null;
        
        return { name, price, weight, image, originalPrice };
    }
    
    // Cart management functions
    function addToCart(item) {
        try {
            // Check if item already exists
            const existingItem = cartItems.find(cartItem => cartItem.name === item.name);
            
            if (existingItem) {
                // Set to the specified quantity
                existingItem.quantity = item.quantity; 
            } else {
                // Add new item
                cartItems.push(item);
            }
            
            // Update cart icon and count
            recalculateCartCount();
            updateCartIcon();
            
            // Save to localStorage for the cart page
            saveCartToStorage();
            
            // For debugging
            console.log('Cart updated:', cartItems);
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    }
    
    // Calculate total items in cart
    function recalculateCartCount() {
        cartCount = 0;
        cartItems.forEach(item => {
            cartCount += item.quantity;
        });
    }
    
    function removeFromCart(productName) {
        try {
            const itemIndex = cartItems.findIndex(item => item.name === productName);
            
            if (itemIndex > -1) {
                cartItems.splice(itemIndex, 1);
                recalculateCartCount();
                updateCartIcon();
                // Save to localStorage whenever an item is removed
                saveCartToStorage();
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
        }
    }
    
    function updateCartItemQuantity(productName, newQuantity) {
        try {
            const item = cartItems.find(item => item.name === productName);
            
            if (item) {
                item.quantity = newQuantity;
                recalculateCartCount();
                updateCartIcon();
                // Save to localStorage whenever quantity changes
                saveCartToStorage();
            }
        } catch (error) {
            console.error('Error updating cart item quantity:', error);
        }
    }
    
    function updateCartIcon() {
        try {
            // Update cart count display
            const cartCountElement = document.querySelector('.cart-count');
            const cartIcon = document.querySelector('.cart-icon');
            
            if (cartCountElement && cartIcon) {
                cartCountElement.textContent = cartCount;
                
                if (cartCount > 0) {
                    cartCountElement.style.display = 'flex';
                    // Add a highlight effect to the cart icon
                    cartIcon.classList.add('has-items');
                } else {
                    cartCountElement.style.display = 'none';
                    cartIcon.classList.remove('has-items');
                }
            }
        } catch (error) {
            console.error('Error updating cart icon:', error);
        }
    }
    
    // Cart icon navigation is now handled by the anchor tag wrapping it
    
    // Save cart items to localStorage for cart page
    function saveCartToStorage() {
        try {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            // Make sure the storage event is triggered for other tabs/windows
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    // Function to get product's original price if available
    function getProductOriginalPrice(productElement) {
        const originalPriceElement = productElement.querySelector('.original-price');
        return originalPriceElement ? originalPriceElement.textContent : null;
    }

    // Function to get product's image if available
    function getProductImage(productElement) {
        const imageElement = productElement.querySelector('.product-image img');
        return imageElement ? imageElement.src : null;
    }
    
    // Location-based availability and delivery time
    const locationSelector = document.querySelector('.location-selector');
    if (locationSelector) {
        // Initialize delivery times for different locations
        const deliveryTimes = {
            'kharghar': 27,
            'vashi': 35,
            'belapur': 42
        };
        
        locationSelector.addEventListener('change', function() {
            const selectedLocation = this.value;
            const stockInfoElements = document.querySelectorAll('.stock-info');
            const deliveryTimeElement = document.getElementById('delivery-time');
            
            // Update delivery time based on selected location
            if (deliveryTimeElement && deliveryTimes[selectedLocation]) {
                deliveryTimeElement.textContent = deliveryTimes[selectedLocation];
            }
            
            // Update stock information based on location
            if (stockInfoElements.length > 0) {
                stockInfoElements.forEach(element => {
                    const availabilitySpan = element.querySelector('span');
                    const locationSpan = element.querySelector('.location');
                    
                    if (!availabilitySpan || !locationSpan) return;
                    
                    // Simulate different availability for different locations
                    if (selectedLocation === 'kharghar') {
                        availabilitySpan.className = Math.random() > 0.2 ? 'in-stock' : 'limited-stock';
                        availabilitySpan.textContent = availabilitySpan.className === 'in-stock' ? 'In Stock' : 'Limited Stock';
                        locationSpan.textContent = 'in Athens, Kharghar';
                    } else if (selectedLocation === 'vashi') {
                        availabilitySpan.className = Math.random() > 0.5 ? 'in-stock' : 'limited-stock';
                        availabilitySpan.textContent = availabilitySpan.className === 'in-stock' ? 'In Stock' : 'Limited Stock';
                        locationSpan.textContent = 'in Nerul, Vashi';
                    } else if (selectedLocation === 'belapur') {
                        availabilitySpan.className = Math.random() > 0.3 ? 'in-stock' : 'limited-stock';
                        availabilitySpan.textContent = availabilitySpan.className === 'in-stock' ? 'In Stock' : 'Limited Stock';
                        locationSpan.textContent = 'in CBD Belapur';
                    } else {
                        availabilitySpan.className = 'in-stock';
                        availabilitySpan.textContent = 'In Stock';
                        locationSpan.textContent = 'in your area';
                    }
                });
            }
            
            // Update product delivery times
            const productDeliveryTimes = document.querySelectorAll('.product-card .delivery-time .time-value');
            productDeliveryTimes.forEach(element => {
                element.textContent = deliveryTimes[selectedLocation] || 30;
            });
        });
    }
    
    // Initialize and update product delivery times
    function initializeDeliveryTimes() {
        // Get all product delivery time elements
        const deliveryTimeElements = document.querySelectorAll('.product-card .delivery-time span:nth-child(2)');
        
        // Update format to have the time as a separate span for easier updates
        deliveryTimeElements.forEach(element => {
            const currentText = element.textContent.trim();
            // Check if already formatted
            if (!currentText.includes('MINS')) {
                return;
            }
            const timeValue = parseInt(currentText) || 27;
            element.innerHTML = `<span class="time-value">${timeValue}</span> MINS`;
        });
        
        // Trigger location change to update all times if a location is selected
        const locationSelector = document.getElementById('locationSelector');
        if (locationSelector) {
            const event = new Event('change');
            locationSelector.dispatchEvent(event);
        }
    }
    
    // Call initialization function when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDeliveryTimes);
    } else {
        initializeDeliveryTimes();
    }
    
    // Initialize everything on page load
    function initialize() {
        // Load cart from localStorage if available
        try {
            const savedCart = localStorage.getItem('cartItems');
            if (savedCart) {
                cartItems = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            cartItems = [];
        }
        
        // Initialize the add buttons
        initializeAddButtons();
        
        // Initialize cart icon - always recalculate regardless of count
        recalculateCartCount();
        updateCartIcon();
        
        console.log('Cart functionality initialized with', cartItems.length, 'items');
    }
    
    // Run initialization when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initialize, 100); // Small delay to ensure everything is rendered
    });
    
    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', function(e) {
        if (e.key === 'cartItems') {
            try {
                cartItems = JSON.parse(e.newValue || '[]');
                recalculateCartCount();
                updateCartIcon();
                console.log('Cart updated from storage event:', cartItems);
            } catch (error) {
                console.error('Error updating cart from storage event:', error);
            }
        }
    });
    
    // Also run initialization now (in case DOM is already loaded)
    initialize();
    
    // Smart Swaps feature - products that can be swapped when out of stock
    const smartSwapProducts = {
        'Vanaspati': {
            name: 'Pure Cow Ghee',
            price: '₹345',
            originalPrice: '₹399',
            weight: '450 g',
            image: 'Assets/ghee.png',
            brand: 'BeingFresh',
            description: 'Pure Cow Ghee - A healthier alternative with 100% purity'
        }
    };

    // Check if a product has a smart swap alternative
    function hasSmartSwapAlternative(productName) {
        return smartSwapProducts[productName] !== undefined;
    }

    // Get smart swap alternative for a product
    function getSmartSwapAlternative(productName) {
        return smartSwapProducts[productName];
    }
});