import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getFirestore, collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
        let cart = JSON.parse(localStorage.getItem('campusMarketCart')) || [];
        let currentSlide = 0;

        // Update cart badge
        function updateCartBadge() {
            document.getElementById('cartBadge').textContent = cart.length;
        }

        // Load products
        async function loadProducts() {
            try {
                const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(productsQuery);
                
                allProducts = [];
                querySnapshot.forEach((doc) => {
                    allProducts.push({ id: doc.id, ...doc.data() });
                });
                
                displayFlashProducts();
                displayDealsProducts();
                displaySponsoredProducts();
                displayAllProducts();
            } catch (error) {
                console.error('Erreur:', error);
            }
        }

        // Display flash products
        function displayFlashProducts() {
            const container = document.getElementById('flashProducts');
            const flashProducts = allProducts.filter(p => p.onSale).slice(0, 6);
            
            if (flashProducts.length === 0) {
                container.innerHTML = '<p style="color: white; padding: 20px;">Aucune vente flash disponible</p>';
                return;
            }

            container.innerHTML = flashProducts.map(createProductCard).join('');
        }

        // Display deals products
        function displayDealsProducts() {
            const container = document.getElementById('dealsProducts');
            const deals = allProducts.slice(0, 6);
            container.innerHTML = deals.map(createProductCard).join('');
        }

        // Display sponsored products
        function displaySponsoredProducts() {
            const container = document.getElementById('sponsoredProducts');
            const sponsored = allProducts.slice(6, 10);
            container.innerHTML = sponsored.map(createProductCard).join('');
        }

        // Display all products
        function displayAllProducts() {
            const container = document.getElementById('allProducts');
            container.innerHTML = allProducts.map(createProductCard).join('');
        }

        // Create product card HTML
        function createProductCard(product) {
            const discount = product.onSale && product.discountPrice ? 
                Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
            const finalPrice = product.onSale && product.discountPrice ? product.discountPrice : product.price;
            const stockPercent = Math.floor(Math.random() * 60) + 20; // Random stock level

            return `
                <div class="product-card">
                    <div class="product-image-container">
                        ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
                        <img src="${product.image || 'https://via.placeholder.com/200'}" alt="${product.name}" class="product-image">
                    </div>
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-price-container">
                            <div class="product-price">${formatPrice(finalPrice)} FCFA</div>
                            ${product.onSale && product.discountPrice ? 
                                `<div class="product-old-price">${formatPrice(product.price)} FCFA</div>` : ''}
                        </div>
                        <div class="product-stock">
                            <div class="stock-bar">
                                <div class="stock-fill" style="width: ${stockPercent}%"></div>
                            </div>
                            <div class="stock-text">${Math.floor(Math.random() * 50) + 10} articles restants</div>
                        </div>
                        <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${product.id}')">
                            🛒 Ajouter au panier
                        </button>
                    </div>
                </div>
            `;
        }

        // Format price
        function formatPrice(price) {
            return new Intl.NumberFormat('fr-FR').format(price);
        }

        // Add to cart
        window.addToCart = function(productId) {
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                const cartProduct = {
                    ...product,
                    cartId: Date.now() + Math.random(),
                    cartPrice: product.onSale && product.discountPrice ? product.discountPrice : product.price
                };
                cart.push(cartProduct);
                localStorage.setItem('campusMarketCart', JSON.stringify(cart));
                updateCartBadge();
                showToast('✅ Ajouté au panier !');
            }
        };

        // Remove from cart
        window.removeFromCart = function(cartId) {
            cart = cart.filter(item => item.cartId !== cartId);
            localStorage.setItem('campusMarketCart', JSON.stringify(cart));
            updateCartBadge();
            renderCart();
        };

        // Open cart
        window.openCart = function() {
            renderCart();
            document.getElementById('cartModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        // Close cart
        window.closeCart = function() {
            document.getElementById('cartModal').classList.remove('active');
            document.body.style.overflow = 'auto';
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
                        <p style="color: #999;">Ajoutez des produits pour commencer</p>
                    </div>
                `;
                cartFooter.innerHTML = '';
                return;
            }

            cartBody.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${formatPrice(item.cartPrice)} FCFA</div>
                    </div>
                    <button class="cart-remove" onclick="removeFromCart(${item.cartId})">×</button>
                </div>
            `).join('');

            const total = cart.reduce((sum, item) => sum + item.cartPrice, 0);

            cartFooter.innerHTML = `
                <div class="cart-total">
                    <span class="cart-total-label">Total (${cart.length} article${cart.length > 1 ? 's' : ''})</span>
                    <span class="cart-total-amount">${formatPrice(total)} FCFA</span>
                </div>
                <button class="whatsapp-btn" onclick="orderViaWhatsApp()">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Commander sur WhatsApp
                </button>
            `;
        }

        // Order via WhatsApp
        window.orderViaWhatsApp = function() {
            const phoneNumber = '2250153707186';
            const total = cart.reduce((sum, item) => sum + item.cartPrice, 0);
            
            let message = '🛒 *NOUVELLE COMMANDE CAMPUS MARKET*\n\n';
            message += '📦 *Produits :*\n\n';
            
            cart.forEach((item, i) => {
                message += `${i + 1}. ${item.name}\n   ${formatPrice(item.cartPrice)} FCFA\n\n`;
            });
            
            message += `💰 *TOTAL: ${formatPrice(total)} FCFA*\n`;
            message += `📊 ${cart.length} article${cart.length > 1 ? 's' : ''}\n\n`;
            message += '📍 _Merci de confirmer la disponibilité et les frais de livraison._';

            const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        };

        // Show toast
        function showToast(message) {
            const toast = document.getElementById('toast');
            document.getElementById('toastText').textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        // Carousel
        window.goToSlide = function(index) {
            currentSlide = index;
            const track = document.getElementById('carouselTrack');
            track.style.transform = `translateX(-${index * 100}%)`;
            
            document.querySelectorAll('.dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };

        // Auto carousel
        setInterval(() => {
            currentSlide = (currentSlide + 1) % 3;
            goToSlide(currentSlide);
        }, 5000);

        // Flash sale timer
        function updateTimer() {
            const now = new Date();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            const diff = endOfDay - now;

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            document.getElementById('hours').textContent = String(hours).padStart(2, '0') + 'h';
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0') + 'm';
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0') + 's';
        }

        setInterval(updateTimer, 1000);
        updateTimer();

        // Scroll to products
        window.scrollToProducts = function() {
            document.getElementById('allProductsSection').scrollIntoView({ behavior: 'smooth' });
        };

        // Search
        window.searchProducts = function() {
            const term = document.getElementById('searchInput').value.toLowerCase();
            const filtered = allProducts.filter(p => 
                p.name.toLowerCase().includes(term) || 
                (p.description && p.description.toLowerCase().includes(term))
            );
            
            const container = document.getElementById('allProducts');
            if (filtered.length === 0) {
                container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;"><h3>Aucun résultat</h3></div>';
            } else {
                container.innerHTML = filtered.map(createProductCard).join('');
            }
        };

        // Close modal on outside click
        document.getElementById('cartModal').addEventListener('click', (e) => {
            if (e.target.id === 'cartModal') closeCart();
        });

        // Initialize
        updateCartBadge();
        loadProducts();

        // ========================================
        // PWA INSTALLATION
        // ========================================
        let deferredPrompt;
        const pwaPrompt = document.getElementById('pwaPrompt');
        const installBtn = document.getElementById('installBtn');
        const dismissBtn = document.getElementById('dismissBtn');

        // Enregistrer le service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then((registration) => {
                        console.log('✅ Service Worker enregistré:', registration.scope);
                    })
                    .catch((error) => {
                        console.log('❌ Erreur Service Worker:', error);
                    });
            });
        }

        // Capturer l'événement beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            // Empêcher le prompt par défaut
            e.preventDefault();
            // Stocker l'événement pour l'utiliser plus tard
            deferredPrompt = e;
            
            // Vérifier si l'utilisateur n'a pas déjà refusé
            const hasDeclined = localStorage.getItem('pwaDeclined');
            const declinedDate = localStorage.getItem('pwaDeclinedDate');
            const daysSinceDecline = declinedDate ? 
                (Date.now() - parseInt(declinedDate)) / (1000 * 60 * 60 * 24) : 999;
            
            // Afficher le prompt après 5 secondes si non refusé récemment (< 7 jours)
            if (!hasDeclined || daysSinceDecline > 7) {
                setTimeout(() => {
                    pwaPrompt.classList.add('show');
                }, 5000);
            }
        });

        // Bouton installer
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) {
                return;
            }

            // Afficher le prompt d'installation
            deferredPrompt.prompt();

            // Attendre la réponse de l'utilisateur
            const { outcome } = await deferredPrompt.userChoice;
            
            console.log(`Installation: ${outcome}`);

            // Réinitialiser deferredPrompt
            deferredPrompt = null;

            // Cacher le prompt
            pwaPrompt.classList.remove('show');

            // Si accepté, retirer le flag de refus
            if (outcome === 'accepted') {
                localStorage.removeItem('pwaDeclined');
                localStorage.removeItem('pwaDeclinedDate');
                showToast('✅ Application installée avec succès !');
            }
        });

        // Bouton "Plus tard"
        dismissBtn.addEventListener('click', () => {
            pwaPrompt.classList.remove('show');
            localStorage.setItem('pwaDeclined', 'true');
            localStorage.setItem('pwaDeclinedDate', Date.now().toString());
        });

        // Détecter si l'app est déjà installée
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installée avec succès');
            pwaPrompt.classList.remove('show');
            localStorage.removeItem('pwaDeclined');
            localStorage.removeItem('pwaDeclinedDate');
        });

        // Détection du mode standalone (app installée)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('🎉 Application en mode standalone');
            // Masquer le prompt si déjà en mode app
            pwaPrompt.style.display = 'none';
        }
