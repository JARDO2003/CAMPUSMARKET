   import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

        // Cloudinary Configuration
        const cloudinaryConfig = {
            cloudName: 'djxcqczh1',
            uploadPreset: 'database'
        };

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
        let selectedImageFile = null;

        // Load products
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
                
                updateStats();
                displayProductsTable();
            } catch (error) {
                console.error('Erreur lors du chargement des produits:', error);
            }
        }

        // Update stats
        function updateStats() {
            document.getElementById('totalProducts').textContent = allProducts.length;
            // Ces stats sont simulées - vous pouvez les connecter à une vraie base de données
            document.getElementById('totalViews').textContent = allProducts.length * 15;
            document.getElementById('totalSales').textContent = Math.floor(allProducts.length * 0.3);
        }

        // Display products table
        function displayProductsTable() {
            const tbody = document.getElementById('productsTableBody');
            
            if (allProducts.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px;">
                            Aucun produit ajouté. Commencez par ajouter votre premier produit!
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = allProducts.map(product => `
                <tr>
                    <td>
                        <img src="${product.image || 'https://via.placeholder.com/60'}" 
                             alt="${product.name}" class="product-img">
                    </td>
                    <td>
                        <strong>${product.name}</strong>
                        ${product.onSale ? '<br><span style="color: var(--primary); font-size: 12px;">🏷️ EN PROMOTION</span>' : ''}
                    </td>
                    <td>${product.category}</td>
                    <td>
                        ${product.onSale && product.discountPrice ? `
                            <div>
                                <span style="text-decoration: line-through; color: #999; font-size: 14px;">${formatPrice(product.price)} FCFA</span><br>
                                <strong style="color: var(--primary);">${formatPrice(product.discountPrice)} FCFA</strong>
                                <span style="background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 5px;">
                                    -${Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                                </span>
                            </div>
                        ` : `<strong>${formatPrice(product.price)} FCFA</strong>`}
                    </td>
                    <td>${product.stock || 0}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="editProduct('${product.id}')">
                            ✏️ Modifier
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')">
                            🗑️ Supprimer
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // Upload image to Cloudinary
        async function uploadToCloudinary(file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', cloudinaryConfig.uploadPreset);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement de l\'image');
            }

            const data = await response.json();
            return data.secure_url;
        }

        // Add or Update product
        window.addProduct = async function(event) {
            event.preventDefault();

            const form = document.getElementById('productForm');
            const editId = form.dataset.editId;
            const isEditing = !!editId;

            try {
                // Afficher la progression
                document.getElementById('uploadProgress').style.display = 'block';
                
                let imageUrl;
                
                // Si on modifie et qu'il n'y a pas de nouvelle image
                if (isEditing && !selectedImageFile) {
                    const existingProduct = allProducts.find(p => p.id === editId);
                    imageUrl = existingProduct.image;
                    document.getElementById('progressBar').style.width = '70%';
                } else {
                    // Vérifier qu'une image est sélectionnée pour un nouveau produit
                    if (!selectedImageFile && !isEditing) {
                        showAlert('error', '❌ Veuillez sélectionner une image pour votre produit');
                        document.getElementById('uploadProgress').style.display = 'none';
                        return;
                    }

                    document.getElementById('progressText').textContent = 'Téléchargement de l\'image sur Cloudinary...';
                    document.getElementById('progressBar').style.width = '30%';

                    // Upload image to Cloudinary
                    imageUrl = await uploadToCloudinary(selectedImageFile);
                    document.getElementById('progressBar').style.width = '70%';
                }
                
                document.getElementById('progressText').textContent = isEditing ? 'Mise à jour du produit...' : 'Enregistrement du produit...';

                // Créer le produit avec l'URL de l'image
                const productData = {
                    name: document.getElementById('productName').value,
                    category: document.getElementById('productCategory').value,
                    description: document.getElementById('productDescription').value,
                    price: parseInt(document.getElementById('productPrice').value),
                    stock: parseInt(document.getElementById('productStock').value),
                    image: imageUrl,
                    isNew: document.getElementById('productNew').checked,
                    onSale: document.getElementById('productOnSale').checked,
                    discountPrice: document.getElementById('productOnSale').checked ? 
                        parseInt(document.getElementById('productDiscountPrice').value) : null,
                };

                if (isEditing) {
                    // Update existing product
                    const productRef = doc(db, 'products', editId);
                    await updateDoc(productRef, {
                        ...productData,
                        updatedAt: new Date().toISOString()
                    });
                    showAlert('success', '✅ Produit modifié avec succès!');
                } else {
                    // Add new product
                    productData.createdAt = new Date().toISOString();
                    await addDoc(collection(db, 'products'), productData);
                    showAlert('success', '✅ Produit ajouté avec succès!');
                }
                
                document.getElementById('progressBar').style.width = '100%';
                document.getElementById('progressText').textContent = isEditing ? '✅ Produit modifié avec succès!' : '✅ Produit ajouté avec succès!';
                
                // Reload products
                await loadProducts();
                
                if (isEditing) {
                    cancelEdit();
                } else {
                    resetForm();
                }
                
                // Masquer la barre de progression après 2 secondes
                setTimeout(() => {
                    document.getElementById('uploadProgress').style.display = 'none';
                    document.getElementById('progressBar').style.width = '0%';
                    showSection('my-products');
                }, 2000);
            } catch (error) {
                console.error('Erreur:', error);
                showAlert('error', '❌ Erreur: ' + error.message);
                document.getElementById('uploadProgress').style.display = 'none';
                document.getElementById('progressBar').style.width = '0%';
            }
        };

        // Toggle discount field visibility
        window.toggleDiscountField = function() {
            const onSale = document.getElementById('productOnSale').checked;
            const discountField = document.getElementById('discountField');
            const discountInput = document.getElementById('productDiscountPrice');
            
            if (onSale) {
                discountField.style.display = 'block';
                discountInput.required = true;
            } else {
                discountField.style.display = 'none';
                discountInput.required = false;
                discountInput.value = '';
            }
        };

        // Edit product
        window.editProduct = async function(productId) {
            const product = allProducts.find(p => p.id === productId);
            if (!product) return;

            // Scroll to form
            showSection('add-product');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Fill form with product data
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productNew').checked = product.isNew || false;
            document.getElementById('productOnSale').checked = product.onSale || false;
            
            // Show discount field if on sale
            toggleDiscountField();
            if (product.onSale && product.discountPrice) {
                document.getElementById('productDiscountPrice').value = product.discountPrice;
            }

            // Show image preview
            if (product.image) {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${product.image}" alt="Preview">`;
                preview.classList.remove('empty');
            }

            // Change form title and button
            document.querySelector('#add-product .page-title').textContent = 'Modifier le produit';
            const submitBtn = document.querySelector('#productForm button[type="submit"]');
            submitBtn.textContent = '💾 Enregistrer les modifications';
            submitBtn.style.background = 'var(--secondary)';

            // Store product ID for update
            document.getElementById('productForm').dataset.editId = productId;

            // Show cancel button
            let cancelBtn = document.getElementById('cancelEditBtn');
            if (!cancelBtn) {
                cancelBtn = document.createElement('button');
                cancelBtn.id = 'cancelEditBtn';
                cancelBtn.type = 'button';
                cancelBtn.className = 'btn';
                cancelBtn.textContent = '❌ Annuler';
                cancelBtn.style.background = '#999';
                cancelBtn.onclick = cancelEdit;
                submitBtn.parentElement.insertBefore(cancelBtn, submitBtn.nextSibling);
            }
        };

        // Cancel edit
        window.cancelEdit = function() {
            document.querySelector('#add-product .page-title').textContent = 'Ajouter un produit';
            const submitBtn = document.querySelector('#productForm button[type="submit"]');
            submitBtn.textContent = '✅ Ajouter le produit';
            submitBtn.style.background = 'var(--primary)';
            
            delete document.getElementById('productForm').dataset.editId;
            
            const cancelBtn = document.getElementById('cancelEditBtn');
            if (cancelBtn) cancelBtn.remove();
            
            resetForm();
        };

        // Delete product
        window.deleteProduct = async function(productId) {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
                try {
                    await deleteDoc(doc(db, 'products', productId));
                    alert('✅ Produit supprimé avec succès!');
                    await loadProducts();
                } catch (error) {
                    alert('❌ Erreur lors de la suppression: ' + error.message);
                }
            }
        };

        // Show alert
        function showAlert(type, message) {
            const alertId = type === 'success' ? 'alertSuccess' : 'alertError';
            const alertEl = document.getElementById(alertId);
            alertEl.textContent = message;
            alertEl.classList.add('show');
            
            setTimeout(() => {
                alertEl.classList.remove('show');
            }, 5000);
        }

        // Reset form
        window.resetForm = function() {
            document.getElementById('productForm').reset();
            document.getElementById('imagePreview').innerHTML = '📸 Cliquez pour choisir une photo';
            document.getElementById('imagePreview').classList.add('empty');
            selectedImageFile = null;
        };

        // Preview image
        window.previewImage = function() {
            const fileInput = document.getElementById('productImage');
            const preview = document.getElementById('imagePreview');
            
            if (fileInput.files && fileInput.files[0]) {
                selectedImageFile = fileInput.files[0];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    preview.classList.remove('empty');
                };
                
                reader.readAsDataURL(selectedImageFile);
            } else {
                preview.innerHTML = '📸 Cliquez pour choisir une photo';
                preview.classList.add('empty');
                selectedImageFile = null;
            }
        };

        // Show section
        window.showSection = function(sectionId) {
            // Hide all sections
            document.querySelectorAll('.form-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(sectionId).classList.add('active');
            
            // Update active menu item
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.classList.add('active');
        };

        // Format price
        function formatPrice(price) {
            return new Intl.NumberFormat('fr-FR').format(price);
        }

        // Initialize
        loadProducts();
