```javascript
/* =========================================================
   NOVA STORE
   APP.JS
   الملف الرئيسي لوظائف واجهة المتجر
========================================================= */

"use strict";

/* =========================================================
   1. إعدادات Supabase
========================================================= */

/*
    ضع هنا:

    1) رابط مشروع Supabase
    2) المفتاح العام ANON KEY

    لا تضع service_role key هنا أبدًا.
*/

const SUPABASE_URL = "";

const SUPABASE_ANON_KEY = "";


/* =========================================================
   2. متغيرات التطبيق
========================================================= */

let supabaseClient = null;

let allProducts = [];

let filteredProducts = [];

let currentCategory = "all";

let currentSearch = "";

let currentSort = "default";

let selectedProduct = null;

let cartItems = [];

let isLoadingProducts = false;


/* =========================================================
   3. تشغيل التطبيق
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    initializeApplication();

});


/* =========================================================
   4. تهيئة التطبيق
========================================================= */

async function initializeApplication() {

    setCurrentYear();

    setupNavigation();

    setupSearch();

    setupContactForm();

    setupMessageForm();

    setupOrderForm();

    setupScrollButton();

    loadLocalCart();

    updateCartCounter();

    initializeSupabase();

    if (supabaseClient) {

        await loadProducts();

    } else {

        loadDemoProducts();

    }

}


/* =========================================================
   5. تهيئة Supabase
========================================================= */

function initializeSupabase() {

    if (
        !SUPABASE_URL ||
        !SUPABASE_ANON_KEY
    ) {

        console.warn(
            "Supabase غير متصل بعد."
        );

        return;

    }


    if (
        typeof window.supabase === "undefined"
    ) {

        console.warn(
            "مكتبة Supabase غير موجودة في الصفحة."
        );

        return;

    }


    try {

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );

        console.log(
            "تم إنشاء اتصال Supabase."
        );

    } catch (error) {

        console.error(
            "فشل إنشاء اتصال Supabase:",
            error
        );

        supabaseClient = null;

    }

}


/* =========================================================
   6. السنة الحالية
========================================================= */

function setCurrentYear() {

    const yearElement =
        document.getElementById(
            "currentYear"
        );

    if (yearElement) {

        yearElement.textContent =
            new Date().getFullYear();

    }

}


/* =========================================================
   7. التنقل
========================================================= */

function setupNavigation() {

    const links =
        document.querySelectorAll(
            ".nav-link"
        );

    links.forEach(function (link) {

        link.addEventListener(
            "click",
            function () {

                links.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );

                this.classList.add(
                    "active"
                );

            }
        );

    });

}


/* =========================================================
   8. البحث
========================================================= */

function setupSearch() {

    const searchForm =
        document.getElementById(
            "searchForm"
        );

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (!searchForm || !searchInput) {
        return;
    }


    searchForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            currentSearch =
                searchInput.value.trim();

            applyFilters();

            const productsSection =
                document.getElementById(
                    "products"
                );

            if (productsSection) {

                productsSection.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );


    searchInput.addEventListener(
        "input",
        function () {

            currentSearch =
                this.value.trim();

            showSearchSuggestions();

            applyFilters();

        }
    );

}


/* =========================================================
   9. اقتراحات البحث
========================================================= */

function showSearchSuggestions() {

    const results =
        document.getElementById(
            "searchResults"
        );

    const input =
        document.getElementById(
            "searchInput"
        );


    if (!results || !input) {
        return;
    }


    const query =
        input.value.trim().toLowerCase();


    if (!query) {

        results.style.display =
            "none";

        results.innerHTML = "";

        return;

    }


    const matches =
        allProducts
            .filter(function (product) {

                return productName(
                    product
                )
                    .toLowerCase()
                    .includes(query);

            })
            .slice(0, 6);


    if (!matches.length) {

        results.innerHTML =
            `<div style="padding:12px;font-size:11px;color:#64748b">
                لا توجد نتائج
            </div>`;

        results.style.display =
            "block";

        return;

    }


    results.innerHTML =
        matches
            .map(function (product) {

                return `
                    <button
                        type="button"
                        class="search-result-item"
                        onclick="selectSearchProduct('${escapeAttribute(product.id)}')"
                        style="
                            width:100%;
                            display:flex;
                            align-items:center;
                            gap:10px;
                            padding:10px;
                            border:0;
                            background:white;
                            text-align:right;
                            cursor:pointer;
                            border-radius:8px;
                        "
                    >

                        <span style="font-size:20px">
                            ${productEmoji(product)}
                        </span>

                        <span>
                            <strong
                                style="
                                    display:block;
                                    font-size:11px;
                                "
                            >
                                ${escapeHTML(
                                    productName(product)
                                )}
                            </strong>

                            <small
                                style="
                                    color:#635bff;
                                "
                            >
                                ${formatPrice(
                                    productPrice(product)
                                )}
                            </small>
                        </span>

                    </button>
                `;

            })
            .join("");


    results.style.display =
        "block";

}


/* =========================================================
   10. اختيار نتيجة بحث
========================================================= */

function selectSearchProduct(id) {

    const product =
        allProducts.find(
            function (item) {

                return String(item.id) ===
                    String(id);

            }
        );


    if (!product) {
        return;
    }


    const searchResults =
        document.getElementById(
            "searchResults"
        );

    if (searchResults) {

        searchResults.style.display =
            "none";

    }


    const searchInput =
        document.getElementById(
            "searchInput"
        );

    if (searchInput) {

        searchInput.value =
            productName(product);

    }


    openOrderModal(product);

}


/* =========================================================
   11. إغلاق نتائج البحث عند النقر خارجها
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const searchArea =
            document.querySelector(
                ".header-search"
            );

        const results =
            document.getElementById(
                "searchResults"
            );


        if (
            searchArea &&
            results &&
            !searchArea.contains(event.target)
        ) {

            results.style.display =
                "none";

        }

    }
);


/* =========================================================
   12. تحميل المنتجات من Supabase
========================================================= */

async function loadProducts() {

    if (!supabaseClient) {

        loadDemoProducts();

        return;

    }


    showProductsLoading(true);

    isLoadingProducts = true;


    try {

        const response =
            await supabaseClient
                .from("products")
                .select("*")
                .eq("is_active", true)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (response.error) {

            throw response.error;

        }


        allProducts =
            Array.isArray(response.data)
                ? response.data
                : [];


        filteredProducts =
            [...allProducts];


        updateProductsCounter();

        applyFilters();


    } catch (error) {

        console.error(
            "خطأ في تحميل المنتجات:",
            error
        );


        showToast(
            "تعذر تحميل المنتجات من قاعدة البيانات.",
            "error"
        );


        loadDemoProducts();

    } finally {

        isLoadingProducts = false;

        showProductsLoading(false);

    }

}


/* =========================================================
   13. المنتجات التجريبية
========================================================= */

function loadDemoProducts() {

    allProducts = [

        {
            id: "demo-1",
            name: "منتج إلكتروني تجريبي",
            title: "منتج إلكتروني تجريبي",
            description:
                "هذا المنتج تجريبي وسيتم استبداله بالمنتجات التي تضيفها الإدارة.",
            price: 120,
            category: "electronics",
            image_url: "",
            is_active: true,
            created_at:
                new Date().toISOString()
        },

        {
            id: "demo-2",
            name: "منتج منزلي تجريبي",
            title: "منتج منزلي تجريبي",
            description:
                "منتج تجريبي لعرض شكل المتجر قبل ربط قاعدة البيانات.",
            price: 75,
            category: "home",
            image_url: "",
            is_active: true,
            created_at:
                new Date().toISOString()
        },

        {
            id: "demo-3",
            name: "إكسسوار تجريبي",
            title: "إكسسوار تجريبي",
            description:
                "هذا مثال مؤقت حتى تبدأ الإدارة بإضافة المنتجات.",
            price: 35,
            category: "accessories",
            image_url: "",
            is_active: true,
            created_at:
                new Date().toISOString()
        }

    ];


    filteredProducts =
        [...allProducts];


    updateProductsCounter();

    applyFilters();

}


/* =========================================================
   14. تحديث عدد المنتجات
========================================================= */

function updateProductsCounter() {

    const counter =
        document.getElementById(
            "statProducts"
        );


    if (counter) {

        counter.textContent =
            `${allProducts.length}+`;

    }

}


/* =========================================================
   15. تطبيق الفلاتر
========================================================= */

function applyFilters() {

    let result =
        [...allProducts];


    if (currentCategory !== "all") {

        result =
            result.filter(
                function (product) {

                    return normalizeCategory(
                        productCategory(product)
                    ) ===
                    normalizeCategory(
                        currentCategory
                    );

                }
            );

    }


    if (currentSearch) {

        const query =
            currentSearch.toLowerCase();


        result =
            result.filter(
                function (product) {

                    const text = [
                        productName(product),
                        productDescription(product),
                        productCategory(product)
                    ]
                        .join(" ")
                        .toLowerCase();


                    return text.includes(query);

                }
            );

    }


    result =
        sortProductArray(
            result,
            currentSort
        );


    filteredProducts =
        result;


    renderProducts(
        filteredProducts
    );

}


/* =========================================================
   16. ترتيب المنتجات
========================================================= */

function sortProductArray(
    products,
    sort
) {

    const result =
        [...products];


    if (sort === "price-low") {

        result.sort(
            function (a, b) {

                return productPrice(a) -
                    productPrice(b);

            }
        );

    }


    if (sort === "price-high") {

        result.sort(
            function (a, b) {

                return productPrice(b) -
                    productPrice(a);

            }
        );

    }


    if (sort === "newest") {

        result.sort(
            function (a, b) {

                return new Date(
                    b.created_at || 0
                ) -
                new Date(
                    a.created_at || 0
                );

            }
        );

    }


    return result;

}


/* =========================================================
   17. الفلترة حسب التصنيف
========================================================= */

function filterCategory(category) {

    currentCategory =
        category || "all";


    document
        .querySelectorAll(
            ".category-card"
        )
        .forEach(
            function (button) {

                button.classList.toggle(
                    "active",
                    button.dataset.category ===
                        currentCategory
                );

            }
        );


    document
        .querySelectorAll(
            ".filter-button"
        )
        .forEach(
            function (button) {

                const text =
                    button.textContent.trim();


                let active = false;


                if (
                    currentCategory === "all" &&
                    text === "الكل"
                ) {

                    active = true;

                }


                if (
                    currentCategory === "electronics" &&
                    text === "إلكترونيات"
                ) {

                    active = true;

                }


                if (
                    currentCategory === "clothes" &&
                    text === "ملابس"
                ) {

                    active = true;

                }


                if (
                    currentCategory === "home" &&
                    text === "المنزل"
                ) {

                    active = true;

                }


                if (
                    currentCategory === "accessories" &&
                    text === "إكسسوارات"
                ) {

                    active = true;

                }


                button.classList.toggle(
                    "active",
                    active
                );

            }
        );


    applyFilters();

}


/* =========================================================
   18. ترتيب المنتجات من الواجهة
========================================================= */

function sortProducts() {

    const select =
        document.getElementById(
            "sortProducts"
        );


    if (!select) {
        return;
    }


    currentSort =
        select.value;


    applyFilters();

}


/* =========================================================
   19. عرض المنتجات
========================================================= */

function renderProducts(products) {

    const grid =
        document.getElementById(
            "productsGrid"
        );


    const empty =
        document.getElementById(
            "emptyProducts"
        );


    if (!grid) {
        return;
    }


    if (!products.length) {

        grid.innerHTML = "";

        if (empty) {
            empty.hidden = false;
        }

        return;

    }


    if (empty) {
        empty.hidden = true;
    }


    grid.innerHTML =
        products
            .map(
                function (product) {

                    return createProductCard(
                        product
                    );

                }
            )
            .join("");

}


/* =========================================================
   20. بطاقة المنتج
========================================================= */

function createProductCard(product) {

    const id =
        escapeAttribute(
            product.id
        );


    const name =
        escapeHTML(
            productName(product)
        );


    const description =
        escapeHTML(
            productDescription(product) ||
            "منتج متوفر في متجر NOVA STORE."
        );


    const price =
        formatPrice(
            productPrice(product)
        );


    const category =
        escapeHTML(
            categoryLabel(
                productCategory(product)
            )
        );


    const image =
        productImage(product);


    const imageHTML =
        image
            ? `
                <img
                    src="${escapeAttribute(image)}"
                    alt="${name}"
                    loading="lazy"
                >
            `
            : `
                <div class="placeholder-image">
                    ${productEmoji(product)}
                </div>
            `;


    return `
        <article
            class="product-card"
            data-product-id="${id}"
        >

            <div class="product-image">

                <span class="product-badge">
                    متوفر
                </span>

                ${imageHTML}

                <button
                    type="button"
                    class="favorite-button"
                    onclick="toggleFavorite('${id}', this)"
                    aria-label="إضافة للمفضلة"
                >
                    ♡
                </button>

            </div>


            <div class="product-info">

                <small class="product-category">
                    ${category}
                </small>

                <h3>
                    ${name}
                </h3>

                <p class="product-description">
                    ${description}
                </p>

                <div class="product-bottom">

                    <div class="product-price">

                        <strong>
                            ${price}
                        </strong>

                        <small>
                            شيكل
                        </small>

                    </div>


                    <button
                        type="button"
                        class="order-button"
                        onclick="openOrderById('${id}')"
                    >
                        اطلب الآن
                    </button>

                </div>

            </div>

        </article>
    `;

}


/* =========================================================
   21. فتح طلب منتج بواسطة ID
========================================================= */

function openOrderById(id) {

    const product =
        allProducts.find(
            function (item) {

                return String(item.id) ===
                    String(id);

            }
        );


    if (!product) {

        showToast(
            "لم يتم العثور على المنتج.",
            "error"
        );

        return;

    }


    openOrderModal(product);

}


/* =========================================================
   22. نافذة الطلب
========================================================= */

function openOrderModal(product) {

    selectedProduct =
        product;


    const modal =
        document.getElementById(
            "orderModal"
        );


    const productId =
        document.getElementById(
            "orderProductId"
        );


    const productNameElement =
        document.getElementById(
            "selectedProductName"
        );


    const productPriceElement =
        document.getElementById(
            "selectedProductPrice"
        );


    if (!modal) {
        return;
    }


    if (productId) {

        productId.value =
            product.id;

    }


    if (productNameElement) {

        productNameElement.textContent =
            productName(product);

    }


    if (productPriceElement) {

        productPriceElement.textContent =
            formatPrice(
                productPrice(product)
            );

    }


    modal.hidden = false;

    document.body.classList.add(
        "modal-open"
    );


    const nameInput =
        document.getElementById(
            "orderName"
        );


    if (nameInput) {

        setTimeout(
            function () {

                nameInput.focus();

            },
            100
        );

    }

}


/* =========================================================
   23. نموذج الطلب
========================================================= */

function setupOrderForm() {

    const form =
        document.getElementById(
            "orderForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            await submitOrder();

        }
    );

}


/* =========================================================
   24. إرسال الطلب
========================================================= */

async function submitOrder() {

    if (!selectedProduct) {

        showToast(
            "اختر منتجًا أولًا.",
            "error"
        );

        return;

    }


    const name =
        document.getElementById(
            "orderName"
        )?.value.trim();


    const phone =
        document.getElementById(
            "orderPhone"
        )?.value.trim();


    const address =
        document.getElementById(
            "orderAddress"
        )?.value.trim();


    const quantity =
        Number(
            document.getElementById(
                "orderQuantity"
            )?.value || 1
        );


    const notes =
        document.getElementById(
            "orderNotes"
        )?.value.trim();


    if (!name || !phone) {

        showToast(
            "اكتب الاسم ورقم الهاتف.",
            "warning"
        );

        return;

    }


    if (
        !Number.isFinite(quantity) ||
        quantity < 1
    ) {

        showToast(
            "الكمية غير صحيحة.",
            "warning"
        );

        return;

    }


    const order = {

        product_id:
            selectedProduct.id,

        product_name:
            productName(selectedProduct),

        product_price:
            productPrice(selectedProduct),

        customer_name:
            name,

        customer_phone:
            phone,

        customer_address:
            address,

        quantity:
            quantity,

        notes:
            notes,

        status:
            "new"

    };


    if (!supabaseClient) {

        saveDemoOrder(order);

        return;

    }


    try {

        const response =
            await supabaseClient
                .from("orders")
                .insert(order);


        if (response.error) {

            throw response.error;

        }


        showToast(
            "تم إرسال طلبك بنجاح.",
            "success"
        );


        resetOrderForm();

        closeModal(
            "orderModal"
        );


    } catch (error) {

        console.error(
            "Order error:",
            error
        );


        showToast(
            "حدث خطأ أثناء إرسال الطلب.",
            "error"
        );

    }

}


/* =========================================================
   25. الطلبات التجريبية
========================================================= */

function saveDemoOrder(order) {

    const orders =
        JSON.parse(
            localStorage.getItem(
                "nova_demo_orders"
            ) || "[]"
        );


    orders.push({

        ...order,

        id:
            "demo-order-" +
            Date.now(),

        created_at:
            new Date().toISOString()

    });


    localStorage.setItem(
        "nova_demo_orders",
        JSON.stringify(orders)
    );


    showToast(
        "تم حفظ الطلب تجريبيًا. بعد ربط Supabase سيصل إلى لوحة الإدارة.",
        "success"
    );


    resetOrderForm();

    closeModal(
        "orderModal"
    );

}


/* =========================================================
   26. إعادة ضبط نموذج الطلب
========================================================= */

function resetOrderForm() {

    const form =
        document.getElementById(
            "orderForm"
        );


    if (form) {

        form.reset();

    }


    const quantity =
        document.getElementById(
            "orderQuantity"
        );


    if (quantity) {

        quantity.value = 1;

    }


    selectedProduct =
        null;

}


/* =========================================================
   27. نموذج التواصل في الصفحة
========================================================= */

function setupContactForm() {

    const form =
        document.getElementById(
            "contactForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "contactName"
                )?.value.trim();


            const phone =
                document.getElementById(
                    "contactPhone"
                )?.value.trim();


            const message =
                document.getElementById(
                    "contactMessage"
                )?.value.trim();


            await sendMessage(
                name,
                phone,
                message
            );


            form.reset();

        }
    );

}


/* =========================================================
   28. نافذة المراسلة
========================================================= */

function setupMessageForm() {

    const form =
        document.getElementById(
            "messageForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "messageName"
                )?.value.trim();


            const phone =
                document.getElementById(
                    "messagePhone"
                )?.value.trim();


            const message =
                document.getElementById(
                    "messageText"
                )?.value.trim();


            await sendMessage(
                name,
                phone,
                message
            );


            form.reset();

        }
    );

}


/* =========================================================
   29. إرسال رسالة
========================================================= */

async function sendMessage(
    name,
    phone,
    message
) {

    if (!name || !message) {

        showToast(
            "اكتب الاسم والرسالة.",
            "warning"
        );

        return;

    }


    const messageData = {

        customer_name:
            name,

        customer_phone:
            phone || "",

        message:
            message,

        status:
            "new"

    };


    if (!supabaseClient) {

        saveDemoMessage(
            messageData
        );

        return;

    }


    try {

        const response =
            await supabaseClient
                .from("messages")
                .insert(messageData);


        if (response.error) {

            throw response.error;

        }


        showToast(
            "تم إرسال رسالتك إلى المتجر.",
            "success"
        );


        closeModal(
            "messageModal"
        );


    } catch (error) {

        console.error(
            "Message error:",
            error
        );


        showToast(
            "تعذر إرسال الرسالة.",
            "error"
        );

    }

}


/* =========================================================
   30. حفظ رسالة تجريبية
========================================================= */

function saveDemoMessage(message) {

    const messages =
        JSON.parse(
            localStorage.getItem(
                "nova_demo_messages"
            ) || "[]"
        );


    messages.push({

        ...message,

        id:
            "demo-message-" +
            Date.now(),

        created_at:
            new Date().toISOString()

    });


    localStorage.setItem(
        "nova_demo_messages",
        JSON.stringify(messages)
    );


    showToast(
        "تم حفظ الرسالة تجريبيًا. بعد ربط Supabase ستصل إلى لوحة الإدارة.",
        "success"
    );


    closeModal(
        "messageModal"
    );

}


/* =========================================================
   31. إظهار الرسائل
========================================================= */

function openMessages() {

    const modal =
        document.getElementById(
            "messageModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden = false;

    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   32. فتح الطلبات
========================================================= */

function openCart() {

    renderCart();

    const modal =
        document.getElementById(
            "cartModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden = false;

    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   33. إغلاق أي نافذة
========================================================= */

function closeModal(id) {

    const modal =
        document.getElementById(id);


    if (!modal) {
        return;
    }


    modal.hidden = true;


    const anyModalOpen =
        document.querySelector(
            ".modal-overlay:not([hidden])"
        );


    if (!anyModalOpen) {

        document.body.classList.remove(
            "modal-open"
        );

    }

}


/* =========================================================
   34. الضغط على خلفية النافذة
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target.classList &&
            event.target.classList.contains(
                "modal-overlay"
            )
        ) {

            event.target.hidden = true;

            const anyOpen =
                document.querySelector(
                    ".modal-overlay:not([hidden])"
                );

            if (!anyOpen) {

                document.body.classList.remove(
                    "modal-open"
                );

            }

        }

    }
);


/* =========================================================
   35. السلة المحلية
========================================================= */

function loadLocalCart() {

    try {

        cartItems =
            JSON.parse(
                localStorage.getItem(
                    "nova_cart"
                ) || "[]"
            );


        if (!Array.isArray(cartItems)) {

            cartItems = [];

        }

    } catch (error) {

        cartItems = [];

    }

}


/* =========================================================
   36. حفظ السلة
========================================================= */

function saveLocalCart() {

    localStorage.setItem(
        "nova_cart",
        JSON.stringify(cartItems)
    );


    updateCartCounter();

}


/* =========================================================
   37. إضافة للمفضلة
========================================================= */

function toggleFavorite(
    id,
    button
) {

    const favorites =
        JSON.parse(
            localStorage.getItem(
                "nova_favorites"
            ) || "[]"
        );


    const index =
        favorites.indexOf(
            String(id)
        );


    if (index === -1) {

        favorites.push(
            String(id)
        );


        if (button) {

            button.textContent =
                "♥";

        }


        showToast(
            "تمت إضافة المنتج للمفضلة.",
            "success"
        );


    } else {

        favorites.splice(
            index,
            1
        );


        if (button) {

            button.textContent =
                "♡";

        }


        showToast(
            "تمت إزالة المنتج من المفضلة.",
            "success"
        );

    }


    localStorage.setItem(
        "nova_favorites",
        JSON.stringify(favorites)
    );

}


/* =========================================================
   38. إضافة المنتج إلى الطلبات المحلية
========================================================= */

function addToCart(product) {

    if (!product) {
        return;
    }


    const existing =
        cartItems.find(
            function (item) {

                return String(item.product_id) ===
                    String(product.id);

            }
        );


    if (existing) {

        existing.quantity += 1;

    } else {

        cartItems.push({

            product_id:
                product.id,

            product_name:
                productName(product),

            price:
                productPrice(product),

            quantity:
                1

        });

    }


    saveLocalCart();


    showToast(
        "تمت إضافة المنتج إلى قائمة الطلبات.",
        "success"
    );

}


/* =========================================================
   39. حذف عنصر من السلة
========================================================= */

function removeFromCart(
    productId
) {

    cartItems =
        cartItems.filter(
            function (item) {

                return String(
                    item.product_id
                ) !== String(
                    productId
                );

            }
        );


    saveLocalCart();

    renderCart();

}


/* =========================================================
   40. تحديث عداد السلة
========================================================= */

function updateCartCounter() {

    const count =
        cartItems.reduce(
            function (total, item) {

                return total +
                    Number(
                        item.quantity || 1
                    );

            },
            0
        );


    const element =
        document.getElementById(
            "cartCount"
        );


    if (element) {

        element.textContent =
            count;

    }

}


/* =========================================================
   41. عرض السلة
========================================================= */

function renderCart() {

    const container =
        document.getElementById(
            "cartContent"
        );


    if (!container) {
        return;
    }


    if (!cartItems.length) {

        container.innerHTML = `

            <div class="empty-cart">

                <span>🛒</span>

                <h3>
                    لا توجد طلبات
                </h3>

                <p>
                    لم تقم بإضافة أي منتج بعد.
                </p>

            </div>

        `;

        return;

    }


    let total = 0;


    const itemsHTML =
        cartItems.map(
            function (item) {

                const price =
                    Number(
                        item.price || 0
                    );


                const quantity =
                    Number(
                        item.quantity || 1
                    );


                total +=
                    price *
                    quantity;


                return `

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:space-between;
                            gap:10px;
                            padding:14px 0;
                            border-bottom:1px solid #e2e8f0;
                        "
                    >

                        <div>

                            <strong
                                style="
                                    display:block;
                                    font-size:12px;
                                "
                            >
                                ${escapeHTML(
                                    item.product_name
                                )}
                            </strong>

                            <small
                                style="
                                    color:#64748b;
                                "
                            >
                                الكمية:
                                ${quantity}
                            </small>

                        </div>


                        <div
                            style="
                                text-align:left;
                            "
                        >

                            <strong
                                style="
                                    display:block;
                                    color:#635bff;
                                "
                            >
                                ${formatPrice(
                                    price *
                                    quantity
                                )}
                            </strong>

                            <button
                                type="button"
                                onclick="removeFromCart('${escapeAttribute(item.product_id)}')"
                                style="
                                    border:0;
                                    background:none;
                                    color:#dc2626;
                                    font-size:9px;
                                "
                            >
                                حذف
                            </button>

                        </div>

                    </div>

                `;

            }
        ).join("");


    container.innerHTML = `

        <div>

            ${itemsHTML}

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    padding:18px 0;
                    font-weight:900;
                "
            >

                <span>
                    المجموع
                </span>

                <strong
                    style="
                        color:#635bff;
                    "
                >
                    ${formatPrice(total)}
                </strong>

            </div>

            <button
                type="button"
                class="primary-button full-button"
                onclick="checkoutCart()"
            >
                إرسال طلب القائمة
            </button>

        </div>

    `;

}


/* =========================================================
   42. إرسال قائمة السلة
========================================================= */

function checkoutCart() {

    if (!cartItems.length) {

        showToast(
            "لا توجد منتجات في القائمة.",
            "warning"
        );

        return;

    }


    const firstItem =
        cartItems[0];


    const product =
        allProducts.find(
            function (item) {

                return String(item.id) ===
                    String(firstItem.product_id);

            }
        );


    if (product) {

        openOrderModal(product);

    } else {

        showToast(
            "افتح المنتج من المتجر لإرسال الطلب.",
            "warning"
        );

    }

}


/* =========================================================
   43. نموذج تواصل خارجي
========================================================= */

function openContact() {

    const section =
        document.getElementById(
            "contact"
        );


    if (section) {

        section.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* =========================================================
   44. زر العودة للأعلى
========================================================= */

function setupScrollButton() {

    const button =
        document.getElementById(
            "backToTop"
        );


    if (!button) {
        return;
    }


    window.addEventListener(
        "scroll",
        function () {

            if (window.scrollY > 500) {

                button.classList.add(
                    "show"
                );

            } else {

                button.classList.remove(
                    "show"
                );

            }

        }
    );

}


function scrollToTop() {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   45. إظهار التحميل
========================================================= */

function showProductsLoading(show) {

    const loading =
        document.getElementById(
            "productsLoading"
        );


    if (!loading) {
        return;
    }


    loading.hidden =
        !show;

}


/* =========================================================
   46. إشعارات
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    if (!container) {

        alert(message);

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(
        function () {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateY(10px)";


            setTimeout(
                function () {

                    toast.remove();

                },
                300
            );

        },
        3500
    );

}


/* =========================================================
   47. بيانات المنتج
========================================================= */

function productName(product) {

    return (
        product?.name ||
        product?.title ||
        "منتج بدون اسم"
    );

}


function productDescription(product) {

    return (
        product?.description ||
        product?.details ||
        ""
    );

}


function productPrice(product) {

    const value =
        Number(
            product?.price || 0
        );


    return Number.isFinite(value)
        ? value
        : 0;

}


function productCategory(product) {

    return (
        product?.category ||
        "other"
    );

}


function productImage(product) {

    return (
        product?.image_url ||
        product?.image ||
        product?.photo_url ||
        ""
    );

}


/* =========================================================
   48. اسم التصنيف
========================================================= */

function categoryLabel(
    category
) {

    const categories = {

        electronics:
            "إلكترونيات",

        clothes:
            "ملابس",

        home:
            "المنزل",

        accessories:
            "إكسسوارات",

        other:
            "أخرى"

    };


    return (
        categories[
            String(category)
                .toLowerCase()
        ] ||
        category ||
        "أخرى"
    );

}


/* =========================================================
   49. تطبيع التصنيف
========================================================= */

function normalizeCategory(
    category
) {

    const value =
        String(
            category || ""
        )
            .trim()
            .toLowerCase();


    const map = {

        إلكترونيات:
            "electronics",

        الكترونيات:
            "electronics",

        electronics:
            "electronics",

        ملابس:
            "clothes",

        clothes:
            "clothes",

        المنزل:
            "home",

        home:
            "home",

        إكسسوارات:
            "accessories",

        اكسسوارات:
            "accessories",

        accessories:
            "accessories",

        أخرى:
            "other",

        اخرى:
            "other",

        other:
            "other"

    };


    return (
        map[value] ||
        value ||
        "other"
    );

}


/* =========================================================
   50. رمز المنتج
========================================================= */

function productEmoji(product) {

    const category =
        normalizeCategory(
            productCategory(product)
        );


    const icons = {

        electronics:
            "💻",

        clothes:
            "👕",

        home:
            "🏠",

        accessories:
            "🎧",

        other:
            "🛍️"

    };


    return (
        icons[category] ||
        "🛍️"
    );

}


/* =========================================================
   51. تنسيق السعر
========================================================= */

function formatPrice(
    price
) {

    const number =
        Number(price || 0);


    if (!Number.isFinite(number)) {

        return "₪0";

    }


    return (
        "₪" +
        number.toLocaleString(
            "ar",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )
    );

}


/* =========================================================
   52. حماية HTML
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   53. حماية الخصائص
========================================================= */

function escapeAttribute(value) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   54. فتح وإغلاق القائمة للموبايل
========================================================= */

function toggleMobileMenu() {

    const menu =
        document.getElementById(
            "mobileMenu"
        );


    if (!menu) {
        return;
    }


    menu.classList.toggle(
        "open"
    );

}


/* =========================================================
   55. إشعار تجريبي
========================================================= */

function showDemoMessage() {

    showToast(
        "سيتم تفعيل هذه العملية بالكامل بعد إنشاء قاعدة Supabase.",
        "warning"
    );

}


/* =========================================================
   56. تحديث بيانات المنتجات
========================================================= */

async function refreshProducts() {

    if (supabaseClient) {

        await loadProducts();

    } else {

        loadDemoProducts();

    }

}


/* =========================================================
   57. تحديث المنتج من Supabase
========================================================= */

async function getProductById(id) {

    if (!supabaseClient) {

        return allProducts.find(
            function (product) {

                return String(product.id) ===
                    String(id);

            }
        ) || null;

    }


    try {

        const response =
            await supabaseClient
                .from("products")
                .select("*")
                .eq("id", id)
                .maybeSingle();


        if (response.error) {

            throw response.error;

        }


        return response.data || null;


    } catch (error) {

        console.error(
            "getProductById:",
            error
        );


        return null;

    }

}


/* =========================================================
   58. مراقبة تغيرات المنتجات
========================================================= */

function subscribeToProducts() {

    if (!supabaseClient) {
        return;
    }


    try {

        supabaseClient
            .channel(
                "nova-products-channel"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "products"
                },
                function () {

                    refreshProducts();

                }
            )
            .subscribe();


    } catch (error) {

        console.error(
            "Realtime error:",
            error
        );

    }

}


/* =========================================================
   59. تشغيل Realtime
========================================================= */

function enableRealtime() {

    if (!supabaseClient) {
        return;
    }


    subscribeToProducts();

}


/* =========================================================
   60. أدوات عامة
========================================================= */

window.NOVA_STORE = {

    loadProducts,

    refreshProducts,

    openOrderById,

    openOrderModal,

    filterCategory,

    sortProducts,

    showToast,

    addToCart,

    removeFromCart,

    openMessages,

    openCart

};


/* =========================================================
   61. تشغيل Realtime بعد التهيئة
========================================================= */

setTimeout(
    function () {

        if (supabaseClient) {

            enableRealtime();

        }

    },
    1500
);


/* =========================================================
   نهاية app.js
========================================================= */
```
