  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getFirestore, collection, getDocs, query, orderBy, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

        // IMPORTANT: Utilisez vos NOUVELLES clés Firebase (régénérez-les!)
        const firebaseConfig = {
            apiKey: "AIzaSyCGsq9aN-DKPuzsoBFAgEdfNfrzb-__RRo",
            authDomain: "jardo-26efc.firebaseapp.com",
            databaseURL: "https://jardo-26efc-default-rtdb.firebaseio.com",
            projectId: "jardo-26efc",
            storageBucket: "jardo-26efc.firebasestorage.app",
            messagingSenderId: "1062237964287",
            appId: "1:1062237964287:web:fef58a549cd08d6c0a89ca",
            measurementId: "G-4DB71EL12P"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        let allProducts = [];
        let currentCategory = 'all';
        let cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Update cart count
        function updateCartCount() {
            document.getElementById('cartCount').textContent = cart.length;
        }

        // Load products from Firestore
        async function loadProducts() {
            try {
                const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(productsQuery);
                
                allProducts = [];
                querySnapshot.forEach((doc) => {
                    allProducts.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                displayProducts();
            } catch (error) {
                console.error('Erreur lors du chargement des produits:', error);
                document.getElementById('productsGrid').innerHTML = `
                    <div class="empty-state">
                        <h2>Erreur de chargement</h2>
                        <p>Impossible de charger les produits. Vérifiez votre connexion.</p>
                    </div>
                `;
            }
        }

        // Display products
        function displayProducts() {
            const productsGrid = document.getElementById('productsGrid');
            
            let productsToShow = allProducts;
            
            // Filter by category
            if (currentCategory !== 'all') {
                productsToShow = allProducts.filter(p => p.category === currentCategory);
            }

            if (productsToShow.length === 0) {
                productsGrid.innerHTML = `
                    <div class="empty-state">
                        <h2>Aucun produit trouvé</h2>
                        <p>Revenez plus tard pour découvrir de nouveaux produits!</p>
                    </div>
                `;
                return;
            }

            productsGrid.innerHTML = productsToShow.map(product => `
                <div class="product-card">
                    ${product.onSale ? '<div class="product-badge" style="background: var(--danger);">PROMO</div>' : 
                      product.isNew ? '<div class="product-badge">NOUVEAU</div>' : ''}
                    <img src="${product.image || 'https://via.placeholder.com/280x250?text=Produit'}" 
                         alt="${product.name}" 
                         class="product-image">
                    <div class="product-info">
                        <div class="product-category">${product.category || 'Général'}</div>
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-description">${product.description || 'Description non disponible'}</p>
                        <div class="product-footer">
                            ${product.onSale && product.discountPrice ? `
                                <div>
                                    <div style="text-decoration: line-through; color: #999; font-size: 16px;">
                                        ${formatPrice(product.price)} FCFA
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                        <span class="product-price" style="font-size: 22px;">
                                            ${formatPrice(product.discountPrice)} FCFA
                                        </span>
                                        <span style="background: var(--danger); color: white; padding: 4px 8px; border-radius: 6px; font-size: 13px; font-weight: 700;">
                                            -${Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            ` : `
                                <span class="product-price">${formatPrice(product.price)} FCFA</span>
                            `}
                            <button class="add-to-cart" onclick="addToCart('${product.id}')">
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Format price
        function formatPrice(price) {
            return new Intl.NumberFormat('fr-FR').format(price);
        }

        // Show toast notification
        function showToast(title, text, icon = '✅') {
            const toast = document.getElementById('toast');
            const toastTitle = document.getElementById('toastTitle');
            const toastText = document.getElementById('toastText');
            const toastIcon = toast.querySelector('.toast-icon');
            
            toastTitle.textContent = title;
            toastText.textContent = text;
            toastIcon.textContent = icon;
            
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        // Add to cart
        window.addToCart = function(productId) {
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                // Use discount price if on sale, otherwise regular price
                const cartProduct = {
                    ...product,
                    cartPrice: product.onSale && product.discountPrice ? product.discountPrice : product.price,
                    cartId: Date.now() + Math.random() // Unique ID for cart item
                };
                cart.push(cartProduct);
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                
                // Show toast notification
                const priceToShow = product.onSale && product.discountPrice ? product.discountPrice : product.price;
                showToast(
                    'Ajouté au panier !',
                    `${product.name} - ${formatPrice(priceToShow)} FCFA`,
                    '🛒'
                );
            }
        };

        // Remove from cart
        window.removeFromCart = function(cartId) {
            cart = cart.filter(item => item.cartId !== cartId);
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            renderCart();
            
            if (cart.length === 0) {
                closeCart();
            }
        };

        // Clear cart
        window.clearCart = function() {
            if (confirm('Voulez-vous vraiment vider votre panier ?')) {
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                closeCart();
            }
        };

        // Render cart
        function renderCart() {
            const cartBody = document.getElementById('cartBody');
            const cartFooter = document.getElementById('cartFooter');
            
            if (cart.length === 0) {
                cartBody.innerHTML = `
                    <div class="cart-empty">
                        <div class="cart-empty-icon">🛒</div>
                        <h3>Votre panier est vide</h3>
                        <p>Ajoutez des produits pour commencer vos achats</p>
                    </div>
                `;
                cartFooter.innerHTML = '';
                return;
            }

            // Render items
            cartBody.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-category">${item.category}</div>
                        <div class="cart-item-name">${item.name}</div>
                        <div>
                            ${item.onSale ? `
                                <span class="cart-item-original-price">${formatPrice(item.price)} FCFA</span>
                                <span class="cart-item-badge">-${Math.round(((item.price - item.discountPrice) / item.price) * 100)}%</span>
                            ` : ''}
                        </div>
                        <div class="cart-item-price">${formatPrice(item.cartPrice)} FCFA</div>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.cartId})">
                        🗑️
                    </button>
                </div>
            `).join('');

            // Calculate total
            const total = cart.reduce((sum, item) => sum + item.cartPrice, 0);
            const savings = cart.reduce((sum, item) => {
                if (item.onSale && item.discountPrice) {
                    return sum + (item.price - item.discountPrice);
                }
                return sum;
            }, 0);

            // Render footer
            cartFooter.innerHTML = `
                <div class="cart-total">
                    <div>
                        <div class="cart-total-label">Total (${cart.length} article${cart.length > 1 ? 's' : ''})</div>
                        ${savings > 0 ? `<div style="font-size: 14px; color: var(--success); margin-top: 5px;">
                            💰 Vous économisez ${formatPrice(savings)} FCFA
                        </div>` : ''}
                    </div>
                    <div class="cart-total-amount">${formatPrice(total)} FCFA</div>
                </div>
                <div class="cart-actions">
                    <button class="cart-btn cart-btn-secondary" onclick="clearCart()">
                        🗑️ Vider le panier
                    </button>
                    <button class="cart-btn cart-btn-primary" onclick="orderViaWhatsApp()">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Commander sur WhatsApp
                    </button>
                </div>
            `;
        }

        // Open cart modal
        window.viewCart = function() {
            renderCart();
            document.getElementById('cartModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        // Close cart modal
        window.closeCart = function() {
            document.getElementById('cartModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        };

        // Order via WhatsApp
        window.orderViaWhatsApp = function() {
            if (cart.length === 0) return;

            const phoneNumber = '2250153707186'; // Numéro WhatsApp du fournisseur
            const total = cart.reduce((sum, item) => sum + item.cartPrice, 0);
            
            // Construire le message de commande
            let message = '🛒 *NOUVELLE COMMANDE*\n\n';
            message += '📦 *Produits commandés :*\n\n';
            
            cart.forEach((item, index) => {
                message += `${index + 1}. *${item.name}*\n`;
                message += `   Catégorie: ${item.category}\n`;
                message += `   Prix: ${formatPrice(item.cartPrice)} FCFA`;
                if (item.onSale) {
                    message += ` 🏷️ (Prix normal: ${formatPrice(item.price)} FCFA)`;
                }
                message += '\n\n';
            });
            
            message += `💰 *TOTAL: ${formatPrice(total)} FCFA*\n`;
            message += `📊 Nombre d'articles: ${cart.length}\n\n`;
            message += '📍 _Merci de me confirmer la disponibilité et les détails de livraison._';

            // Encoder le message pour l'URL
            const encodedMessage = encodeURIComponent(message);
            
            // Créer le lien WhatsApp
            const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
            
            // Ouvrir WhatsApp
            window.open(whatsappURL, '_blank');
            
            // Optionnel: Vider le panier après la commande
            // cart = [];
            // localStorage.setItem('cart', JSON.stringify(cart));
            // updateCartCount();
            // closeCart();
        };

        // Close modal when clicking outside
        document.getElementById('cartModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeCart();
            }
        });

        // Filter by category
        window.filterByCategory = function(category) {
            currentCategory = category;
            displayProducts();
            
            // Update active category
            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.classList.add('active');
        };

        // Search products
        window.searchProducts = function() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const productsGrid = document.getElementById('productsGrid');
            
            const filtered = allProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                (p.description && p.description.toLowerCase().includes(searchTerm))
            );

            if (filtered.length === 0) {
                productsGrid.innerHTML = `
                    <div class="empty-state">
                        <h2>Aucun résultat pour "${searchTerm}"</h2>
                        <p>Essayez d'autres mots-clés</p>
                    </div>
                `;
            } else {
                productsGrid.innerHTML = filtered.map(product => `
                    <div class="product-card">
                        ${product.onSale ? '<div class="product-badge" style="background: var(--danger);">PROMO</div>' : 
                          product.isNew ? '<div class="product-badge">NOUVEAU</div>' : ''}
                        <img src="${product.image || 'https://via.placeholder.com/280x250?text=Produit'}" 
                             alt="${product.name}" 
                             class="product-image">
                        <div class="product-info">
                            <div class="product-category">${product.category || 'Général'}</div>
                            <h3 class="product-title">${product.name}</h3>
                            <p class="product-description">${product.description || ''}</p>
                            <div class="product-footer">
                                ${product.onSale && product.discountPrice ? `
                                    <div>
                                        <div style="text-decoration: line-through; color: #999; font-size: 16px;">
                                            ${formatPrice(product.price)} FCFA
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                            <span class="product-price" style="font-size: 22px;">
                                                ${formatPrice(product.discountPrice)} FCFA
                                            </span>
                                            <span style="background: var(--danger); color: white; padding: 4px 8px; border-radius: 6px; font-size: 13px; font-weight: 700;">
                                                -${Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                ` : `
                                    <span class="product-price">${formatPrice(product.price)} FCFA</span>
                                `}
                                <button class="add-to-cart" onclick="addToCart('${product.id}')">
                                    Ajouter
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        };

        // Scroll to products
        window.scrollToProducts = function() {
            document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' });
        };

        // Initialize
        updateCartCount();
        loadProducts();