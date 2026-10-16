(function() {
    const gallery = document.getElementById('gallery');
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const closeBtn = modal.querySelector('.close-btn');
    const cart = document.getElementById('cart');
    const downloadBtn = document.getElementById('download-btn');

    // NEW: checkout modal elements
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutCloseBtn = document.getElementById('checkoutCloseBtn');
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutError = document.getElementById('checkoutError');

    var cartVisible = false;

    function ready() {
        attachCartItemListeners();

        const addToCartButtons = document.getElementsByClassName('item-button');
        for (let button of addToCartButtons) {
            button.addEventListener('click', addToCartClicked);
        }

        const payBtn = document.getElementsByClassName('pay-btn')[0];
        if (payBtn) {
            payBtn.addEventListener('click', payClicked);
        }

        if (checkoutCloseBtn) {
            checkoutCloseBtn.addEventListener('click', closeCheckoutModal);
        }

        if (checkoutModal) {
            checkoutModal.addEventListener('click', (e) => {
                if (e.target === checkoutModal) {
                    closeCheckoutModal();
                }
            });
        }

        if (checkoutForm) {
            checkoutForm.addEventListener('submit', handleCheckoutSubmit);
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                if (!modalImg || !modalImg.src) return;
                fetch(modalImg.src)
                    .then(response => response.blob())
                    .then(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = modalImg.src.split('/').pop() || 'download.jpg';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                    })
                    .catch(err => {
                        console.error('Download failed', err);
                        alert('Failed to download image.');
                    });
            });
        }
    }

    function attachCartItemListeners() {
        const deleteButtons = document.getElementsByClassName('btn-delete');
        for (let button of deleteButtons) {
            button.removeEventListener('click', deleteCartItem);
            button.addEventListener('click', deleteCartItem);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
    } else {
        ready();
    }

    gallery.addEventListener('click', (e) => {
        const target = e.target.closest('.gallery-item');
        if (!target || e.target.classList.contains('item-button')) return;
        if (target.classList.contains('sold-out')) return;

        const src = target.dataset.src;
        const title = target.dataset.title || '';

        modalImg.src = src;
        modalImg.alt = title;
        modalTitle.textContent = title;

        modal.classList.add('open');
    });

    closeBtn.addEventListener('click', () => {
        closeModal();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal.classList.contains('open')) closeModal();
            if (checkoutModal && checkoutModal.classList.contains('open')) closeCheckoutModal();
        }
    });

    function closeModal() {
        modal.classList.remove('open');
        modalImg.src = '';
        modalImg.alt = '';
        modalTitle.textContent = '';
    }

    // ---- NEW: open checkout form instead of paying immediately ----
    function payClicked() {
        const cartItemsContainer = document.getElementsByClassName('cart-items')[0];
        if (cartItemsContainer.childElementCount === 0) {
            alert("Кошничката е празна.");
            return;
        }
        if (checkoutError) checkoutError.textContent = '';
        if (checkoutForm) checkoutForm.reset();
        checkoutModal.classList.add('open');
    }

    function closeCheckoutModal() {
        checkoutModal.classList.remove('open');
    }

    // ---- NEW: validate + finalize purchase ----
    function handleCheckoutSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('checkoutName').value.trim();
        const surname = document.getElementById('checkoutSurname').value.trim();
        const address = document.getElementById('checkoutAddress').value.trim();
        const country = document.getElementById('checkoutCountry').value.trim();
        const city = document.getElementById('checkoutCity').value.trim();
        const phone = document.getElementById('checkoutPhone').value.trim();

        if (!name || !surname || !address || !country || !city || !phone) {
            checkoutError.textContent = 'Ве молиме пополнете ги сите полиња.';
            return;
        }

        const phonePattern = /^[0-9+\s()-]{6,}$/;
        if (!phonePattern.test(phone)) {
            checkoutError.textContent = 'Внесете валиден телефонски број.';
            return;
        }

        checkoutError.textContent = '';

        // Everything ok — finalize the order
        finalizeOrder({ name, surname, address, country, city, phone });
    }

    function finalizeOrder(customer) {
        const cartItemsContainer = document.getElementsByClassName('cart-items')[0];
        const cartItemTitleEls = cartItemsContainer.getElementsByClassName('cart-item-title');

        const purchasedTitles = [];
        for (let i = 0; i < cartItemTitleEls.length; i++) {
            purchasedTitles.push(cartItemTitleEls[i].innerText.trim());
        }

        console.log('Нарачка од:', customer, 'Производи:', purchasedTitles);

        closeCheckoutModal();

        alert(`Успешно купување, ${customer.name} ${customer.surname}! Нарачаните производи ќе бидат испорачани на адреса: ${customer.address}, ${customer.city}, ${customer.country}, во наредните 7 дена. Ви благодариме за нарачката!`);

        purchasedTitles.forEach(markGalleryItemAsSoldOut);

        while (cartItemsContainer.firstChild) {
            cartItemsContainer.removeChild(cartItemsContainer.firstChild);
        }
        updateCartTotal();
        hideCart();
    }

    function markGalleryItemAsSoldOut(title) {
        const galleryItems = gallery.getElementsByClassName('gallery-item');
        for (let item of galleryItems) {
            if (item.dataset.title.trim().toLowerCase() === title.trim().toLowerCase()) {
                item.classList.add('sold-out');

                const button = item.querySelector('.item-button');
                if (button) {
                    button.disabled = true;
                    button.textContent = 'Продадено';
                    button.removeEventListener('click', addToCartClicked);
                }
                break;
            }
        }
    }

    function addToCartClicked(event) {
        const button = event.target;
        const item = button.closest('.gallery-item');

        if (item.classList.contains('sold-out')) {
            alert("Овој производ веќе е продаден.");
            return;
        }

        const title = item.dataset.title;
        const price = item.dataset.price;
        const imageSrc = item.querySelector('img').src;

        addItemToCart(title, price, imageSrc);
        showCart();
    }

    function addItemToCart(title, price, imageSrc) {
        const cartItems = document.getElementsByClassName('cart-items')[0];
        const cartItemTitles = cartItems.getElementsByClassName('cart-item-title');
        for (let i = 0; i < cartItemTitles.length; i++) {
            if (cartItemTitles[i].innerText.trim().toLowerCase() === title.trim().toLowerCase()) {
                alert("Избраниот продукт е веќе во кошничката");
                return;
            }
        }

        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        cartItem.innerHTML = `
            <img src="${imageSrc}" alt="">
            <div class="cart-item-details">
                <span class="cart-item-title">${title}</span>
                <div class="quantity-selector">
                    <input type="text" value="1" class="cart-item-quantity" disabled>
                </div>
                <span class="cart-item-price">${parseFloat(price).toFixed(2)} евра</span>
            </div>
            <button class="btn-delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        cartItems.appendChild(cartItem);

        attachCartItemListeners();
        updateCartTotal();
    }

    function deleteCartItem(event) {
        const buttonClicked = event.target;
        const cartItem = buttonClicked.closest('.cart-item');
        if (cartItem) {
            cartItem.remove();
            updateCartTotal();
            hideCart();
        }
    }

    function updateCartTotal() {
        const cartItemsContainer = document.getElementsByClassName('cart-items')[0];
        const cartItems = cartItemsContainer.getElementsByClassName('cart-item');
        let total = 0;
        for (let i = 0; i < cartItems.length; i++) {
            const cartItem = cartItems[i];
            const priceElement = cartItem.querySelector('.cart-item-price');
            const quantityElement = cartItem.querySelector('.cart-item-quantity');
            const price = parseFloat(priceElement.innerText.replace(' евра', ''));
            const quantity = parseInt(quantityElement.value);
            total += price * quantity;
        }
        total = Math.round(total * 100) / 100;
        const totalPriceElement = document.getElementsByClassName('cart-total-price')[0];
        if (totalPriceElement) {
            totalPriceElement.innerText = total.toFixed(2) + ' евра';
        }
    }

    function showCart() {
        cartVisible = true;
        cart.classList.add('open');
    }

    function hideCart() {
        const cartItems = document.getElementsByClassName('cart-items')[0];
        if (cartItems.childElementCount === 0) {
            cart.classList.remove('open');
            cartVisible = false;
        }
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 850) {
            cart.classList.add('open');
        } else {
            if (cartVisible) {
                cart.classList.add('open');
            } else {
                cart.classList.remove('open');
            }
        }
    });

    if (window.innerWidth <= 850) {
        cart.classList.add('open');
    } else {
        cart.classList.remove('open');
    }
})();