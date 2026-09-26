/* =========================================================
   NOVA STORE - ADMIN.JS
   لوحة تحكم الإدارة
   ========================================================= */

/* =========================================================
   1) إعدادات Supabase
   =========================================================
   مهم:
   ضع هنا نفس SUPABASE_URL و SUPABASE_ANON_KEY
   الموجودين عندك في app.js
   ========================================================= */

const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

/* =========================================================
   2) إنشاء اتصال Supabase
   ========================================================= */

let supabaseClient = null;

if (
    typeof window.supabase !== "undefined" &&
    SUPABASE_URL &&
    SUPABASE_ANON_KEY
) {
    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );
}

/* =========================================================
   3) عناصر الصفحة
   ========================================================= */

const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");

const loginForm = document.getElementById("loginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const loginError = document.getElementById("loginError");

const logoutButton = document.getElementById("logoutButton");

const adminName = document.getElementById("adminName");
const adminEmailDisplay = document.getElementById("adminEmailDisplay");

const productsTable = document.getElementById("productsTable");
const ordersTable = document.getElementById("ordersTable");
const messagesTable = document.getElementById("messagesTable");

const productForm = document.getElementById("productForm");

const productId = document.getElementById("productId");
const productName = document.getElementById("productName");
const productDescription = document.getElementById("productDescription");
const productPrice = document.getElementById("productPrice");
const productCategory = document.getElementById("productCategory");
const productImage = document.getElementById("productImage");
const productActive = document.getElementById("productActive");

const productFormTitle = document.getElementById("productFormTitle");

const productsCount = document.getElementById("productsCount");
const ordersCount = document.getElementById("ordersCount");
const messagesCount = document.getElementById("messagesCount");
const activeProductsCount = document.getElementById("activeProductsCount");

const searchProductsInput =
    document.getElementById("searchProducts");

const searchOrdersInput =
    document.getElementById("searchOrders");

const searchMessagesInput =
    document.getElementById("searchMessages");

const messageReplyBox =
    document.getElementById("messageReplyBox");

const replyMessageText =
    document.getElementById("replyMessageText");

const currentMessageId =
    document.getElementById("currentMessageId");

const currentCustomerName =
    document.getElementById("currentCustomerName");

const currentCustomerPhone =
    document.getElementById("currentCustomerPhone");

const notificationBox =
    document.getElementById("notificationBox");

/* =========================================================
   4) بيانات مؤقتة داخل المتصفح
   ========================================================= */

let allProducts = [];
let allOrders = [];
let allMessages = [];

let currentUser = null;
let currentEditingProduct = null;
let currentConversation = null;

/* =========================================================
   5) أدوات مساعدة
   ========================================================= */

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================================================
   6) إشعارات
   ========================================================= */

function showNotification(message, type = "success") {

    if (!notificationBox) {
        alert(message);
        return;
    }

    notificationBox.textContent = message;

    notificationBox.className =
        "notification notification-" + type;

    notificationBox.classList.add("show");

    setTimeout(() => {
        notificationBox.classList.remove("show");
    }, 3500);
}

/* =========================================================
   7) التأكد من وجود Supabase
   ========================================================= */

function checkSupabase() {

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {

        showNotification(
            "ضع رابط Supabase ومفتاح Anon داخل admin.js أولاً.",
            "error"
        );

        return false;
    }

    if (!supabaseClient) {

        showNotification(
            "لم يتم إنشاء اتصال Supabase.",
            "error"
        );

        return false;
    }

    return true;
}

/* =========================================================
   8) تسجيل الدخول
   ========================================================= */

async function loginAdmin(event) {

    event.preventDefault();

    if (!checkSupabase()) {
        return;
    }

    const email =
        adminEmail ? adminEmail.value.trim() : "";

    const password =
        adminPassword ? adminPassword.value : "";

    if (!email || !password) {

        showLoginError(
            "اكتب البريد الإلكتروني وكلمة المرور."
        );

        return;
    }

    setLoginLoading(true);

    try {

        const result =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (result.error) {
            throw result.error;
        }

        currentUser = result.data.user;

        hideLoginError();

        await showDashboard();

        showNotification(
            "تم تسجيل الدخول بنجاح.",
            "success"
        );

    } catch (error) {

        console.error(error);

        showLoginError(
            getArabicAuthError(error)
        );

    } finally {

        setLoginLoading(false);
    }
}

/* =========================================================
   9) أخطاء تسجيل الدخول
   ========================================================= */

function getArabicAuthError(error) {

    const message =
        error && error.message
            ? error.message.toLowerCase()
            : "";

    if (message.includes("invalid login credentials")) {
        return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }

    if (message.includes("email not confirmed")) {
        return "يجب تأكيد البريد الإلكتروني أولاً.";
    }

    if (message.includes("too many requests")) {
        return "تم إرسال طلبات كثيرة، انتظر قليلاً ثم حاول.";
    }

    return "حدث خطأ أثناء تسجيل الدخول.";
}

/* =========================================================
   10) عرض خطأ تسجيل الدخول
   ========================================================= */

function showLoginError(message) {

    if (!loginError) {
        return;
    }

    loginError.textContent = message;
    loginError.style.display = "block";
}

function hideLoginError() {

    if (!loginError) {
        return;
    }

    loginError.textContent = "";
    loginError.style.display = "none";
}

/* =========================================================
   11) حالة زر تسجيل الدخول
   ========================================================= */

function setLoginLoading(isLoading) {

    const button =
        document.getElementById("loginButton");

    if (!button) {
        return;
    }

    if (isLoading) {

        button.disabled = true;
        button.dataset.oldText =
            button.textContent;

        button.textContent =
            "جارٍ تسجيل الدخول...";

    } else {

        button.disabled = false;

        button.textContent =
            button.dataset.oldText ||
            "دخول المدير";
    }
}

/* =========================================================
   12) فحص الجلسة
   ========================================================= */

async function checkSession() {

    if (!supabaseClient) {
        return;
    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

        if (error) {
            console.error(error);
            return;
        }

        if (
            data &&
            data.session &&
            data.session.user
        ) {

            currentUser =
                data.session.user;

            await showDashboard();

        } else {

            showLogin();
        }

    } catch (error) {

        console.error(
            "Session error:",
            error
        );

        showLogin();
    }
}

/* =========================================================
   13) إظهار تسجيل الدخول
   ========================================================= */

function showLogin() {

    if (loginScreen) {
        loginScreen.style.display = "flex";
    }

    if (dashboardScreen) {
        dashboardScreen.style.display = "none";
    }
}

/* =========================================================
   14) إظهار لوحة التحكم
   ========================================================= */

async function showDashboard() {

    if (loginScreen) {
        loginScreen.style.display = "none";
    }

    if (dashboardScreen) {
        dashboardScreen.style.display = "block";
    }

    updateAdminInformation();

    await loadAllData();
}

/* =========================================================
   15) معلومات المدير
   ========================================================= */

function updateAdminInformation() {

    if (!currentUser) {
        return;
    }

    if (adminEmailDisplay) {
        adminEmailDisplay.textContent =
            currentUser.email || "";
    }

    if (adminName) {

        const name =
            currentUser.user_metadata &&
            currentUser.user_metadata.full_name
                ? currentUser.user_metadata.full_name
                : "مدير المتجر";

        adminName.textContent = name;
    }
}

/* =========================================================
   16) تسجيل الخروج
   ========================================================= */

async function logoutAdmin() {

    if (!supabaseClient) {
        showLogin();
        return;
    }

    try {

        await supabaseClient.auth.signOut();

        currentUser = null;

        showLogin();

        showNotification(
            "تم تسجيل الخروج.",
            "success"
        );

    } catch (error) {

        console.error(error);

        showNotification(
            "حدث خطأ أثناء تسجيل الخروج.",
            "error"
        );
    }
}

/* =========================================================
   17) تحميل جميع البيانات
   ========================================================= */

async function loadAllData() {

    if (!checkSupabase()) {
        return;
    }

    await Promise.all([
        loadProducts(),
        loadOrders(),
        loadMessages()
    ]);

    updateStatistics();
}

/* =========================================================
   18) تحميل المنتجات
   ========================================================= */

async function loadProducts() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("products")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        allProducts =
            Array.isArray(data)
                ? data
                : [];

        renderProducts();

    } catch (error) {

        console.error(
            "Products error:",
            error
        );

        allProducts = [];

        renderProducts();

        showNotification(
            "تعذر تحميل المنتجات. تأكد من إنشاء جدول products.",
            "error"
        );
    }
}

/* =========================================================
   19) عرض المنتجات
   ========================================================= */

function renderProducts() {

    if (!productsTable) {
        return;
    }

    let products =
        [...allProducts];

    const search =
        searchProductsInput
            ? searchProductsInput.value
                .trim()
                .toLowerCase()
            : "";

    if (search) {

        products =
            products.filter(product => {

                const text = [
                    product.name,
                    product.description,
                    product.category
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return text.includes(search);
            });
    }

    if (!products.length) {

        productsTable.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">
                    لا توجد منتجات.
                </td>
            </tr>
        `;

        return;
    }

    productsTable.innerHTML =
        products.map((product, index) => {

            const active =
                product.is_active !== false;

            const price =
                Number(product.price || 0)
                    .toFixed(2);

            return `
                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        <div class="admin-product-name">

                            ${
                                product.image_url
                                    ? `
                                    <img
                                        src="${escapeHTML(product.image_url)}"
                                        alt=""
                                        class="admin-product-image"
                                    >
                                    `
                                    : `
                                    <div class="no-product-image">
                                        📦
                                    </div>
                                    `
                            }

                            <strong>
                                ${escapeHTML(product.name)}
                            </strong>

                        </div>
                    </td>

                    <td>
                        ${escapeHTML(
                            product.category || "عام"
                        )}
                    </td>

                    <td>
                        ${price} ₪
                    </td>

                    <td>
                        ${
                            active
                                ? `<span class="status active">نشط</span>`
                                : `<span class="status inactive">مخفي</span>`
                        }
                    </td>

                    <td>
                        ${formatDate(product.created_at)}
                    </td>

                    <td>

                        <button
                            class="admin-action edit"
                            onclick="editProduct('${product.id}')"
                        >
                            تعديل
                        </button>

                        <button
                            class="admin-action toggle"
                            onclick="toggleProduct('${product.id}')"
                        >
                            ${
                                active
                                    ? "إخفاء"
                                    : "إظهار"
                            }
                        </button>

                        <button
                            class="admin-action delete"
                            onclick="deleteProduct('${product.id}')"
                        >
                            حذف
                        </button>

                    </td>

                </tr>
            `;

        }).join("");
}

/* =========================================================
   20) فتح نموذج إضافة منتج
   ========================================================= */

function resetProductForm() {

    if (!productForm) {
        return;
    }

    productForm.reset();

    if (productId) {
        productId.value = "";
    }

    if (productActive) {
        productActive.checked = true;
    }

    currentEditingProduct = null;

    if (productFormTitle) {
        productFormTitle.textContent =
            "إضافة منتج جديد";
    }
}

/* =========================================================
   21) تعديل منتج
   ========================================================= */

function editProduct(id) {

    const product =
        allProducts.find(
            item => String(item.id) === String(id)
        );

    if (!product) {

        showNotification(
            "لم يتم العثور على المنتج.",
            "error"
        );

        return;
    }

    currentEditingProduct = product;

    if (productId) {
        productId.value =
            product.id || "";
    }

    if (productName) {
        productName.value =
            product.name || "";
    }

    if (productDescription) {
        productDescription.value =
            product.description || "";
    }

    if (productPrice) {
        productPrice.value =
            product.price || "";
    }

    if (productCategory) {
        productCategory.value =
            product.category || "";
    }

    if (productImage) {
        productImage.value =
            product.image_url || "";
    }

    if (productActive) {
        productActive.checked =
            product.is_active !== false;
    }

    if (productFormTitle) {
        productFormTitle.textContent =
            "تعديل المنتج";
    }

    const formSection =
        document.getElementById(
            "productFormSection"
        );

    if (formSection) {

        formSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

/* =========================================================
   22) حفظ المنتج
   ========================================================= */

async function saveProduct(event) {

    event.preventDefault();

    if (!checkSupabase()) {
        return;
    }

    const name =
        productName
            ? productName.value.trim()
            : "";

    const description =
        productDescription
            ? productDescription.value.trim()
            : "";

    const price =
        productPrice
            ? Number(productPrice.value)
            : 0;

    const category =
        productCategory
            ? productCategory.value.trim()
            : "";

    const imageUrl =
        productImage
            ? productImage.value.trim()
            : "";

    const isActive =
        productActive
            ? productActive.checked
            : true;

    if (!name) {

        showNotification(
            "اكتب اسم المنتج.",
            "error"
        );

        return;
    }

    if (
        Number.isNaN(price) ||
        price < 0
    ) {

        showNotification(
            "اكتب سعرًا صحيحًا.",
            "error"
        );

        return;
    }

    const payload = {

        name: name,

        description:
            description || null,

        price: price,

        category:
            category || null,

        image_url:
            imageUrl || null,

        is_active:
            isActive
    };

    try {

        let result;

        if (
            currentEditingProduct &&
            currentEditingProduct.id
        ) {

            result =
                await supabaseClient
                    .from("products")
                    .update(payload)
                    .eq(
                        "id",
                        currentEditingProduct.id
                    );

        } else {

            result =
                await supabaseClient
                    .from("products")
                    .insert([
                        payload
                    ]);
        }

        if (result.error) {
            throw result.error;
        }

        showNotification(
            currentEditingProduct
                ? "تم تعديل المنتج."
                : "تمت إضافة المنتج.",
            "success"
        );

        resetProductForm();

        await loadProducts();

        updateStatistics();

    } catch (error) {

        console.error(error);

        showNotification(
            "تعذر حفظ المنتج. تأكد من صلاحيات قاعدة البيانات.",
            "error"
        );
    }
}

/* =========================================================
   23) حذف المنتج
   ========================================================= */

async function deleteProduct(id) {

    const product =
        allProducts.find(
            item => String(item.id) === String(id)
        );

    if (!product) {
        return;
    }

    const confirmed =
        confirm(
            `هل تريد حذف المنتج "${product.name}"؟`
        );

    if (!confirmed) {
        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient
                .from("products")
                .delete()
                .eq("id", id);

        if (error) {
            throw error;
        }

        showNotification(
            "تم حذف المنتج.",
            "success"
        );

        await loadProducts();

        updateStatistics();

    } catch (error) {

        console.error(error);

        showNotification(
            "تعذر حذف المنتج.",
            "error"
        );
    }
}

/* =========================================================
   24) إخفاء / إظهار المنتج
   ========================================================= */

async function toggleProduct(id) {

    const product =
        allProducts.find(
            item => String(item.id) === String(id)
        );

    if (!product) {
        return;
    }

    const newValue =
        product.is_active === false;

    try {

        const {
            error
        } =
            await supabaseClient
                .from("products")
                .update({
                    is_active: newValue
                })
                .eq("id", id);

        if (error) {
            throw error;
        }

        showNotification(
            newValue
                ? "تم إظهار المنتج."
                : "تم إخفاء المنتج.",
            "success"
        );

        await loadProducts();

        updateStatistics();

    } catch (error) {

        console.error(error);

        showNotification(
            "تعذر تغيير حالة المنتج.",
            "error"
        );
    }
}

/* =========================================================
   25) تحميل الطلبات
   ========================================================= */

async function loadOrders() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("orders")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        allOrders =
            Array.isArray(data)
                ? data
                : [];

        renderOrders();

    } catch (error) {

        console.error(
            "Orders error:",
            error
        );

        allOrders = [];

        renderOrders();
    }
}

/* =========================================================
   26) عرض الطلبات
   ========================================================= */

function renderOrders() {

    if (!ordersTable) {
        return;
    }

    let orders =
        [...allOrders];

    const search =
        searchOrdersInput
            ? searchOrdersInput.value
                .trim()
                .toLowerCase()
            : "";

    if (search) {

        orders =
            orders.filter(order => {

                const text = [
                    order.customer_name,
                    order.customer_phone,
                    order.customer_address,
                    order.product_name,
                    order.status
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return text.includes(search);
            });
    }

    if (!orders.length) {

        ordersTable.innerHTML = `
            <tr>
                <td colspan="10" class="empty-row">
                    لا توجد طلبات حتى الآن.
                </td>
            </tr>
        `;

        return;
    }

    ordersTable.innerHTML =
        orders.map((order, index) => {

            const quantity =
                Number(order.quantity || 1);

            const price =
                Number(order.product_price || 0);

            const total =
                price * quantity;

            const status =
                order.status || "new";

            return `
                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(
                                order.customer_name || "-"
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                order.customer_phone || ""
                            )}
                        </small>
                    </td>

                    <td>
                        ${escapeHTML(
                            order.product_name || "-"
                        )}
                    </td>

                    <td>
                        ${quantity}
                    </td>

                    <td>
                        ${price.toFixed(2)} ₪
                    </td>

                    <td>
                        ${total.toFixed(2)} ₪
                    </td>

                    <td>
                        ${escapeHTML(
                            order.customer_address || "-"
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            order.created_at
                        )}
                    </td>

                    <td>

                        <select
                            class="order-status"
                            onchange="updateOrderStatus(
                                '${order.id}',
                                this.value
                            )"
                        >

                            <option
                                value="new"
                                ${
                                    status === "new"
                                        ? "selected"
                                        : ""
                                }
                            >
                                جديد
                            </option>

                            <option
                                value="processing"
                                ${
                                    status === "processing"
                                        ? "selected"
                                        : ""
                                }
                            >
                                قيد التجهيز
                            </option>

                            <option
                                value="shipped"
                                ${
                                    status === "shipped"
                                        ? "selected"
                                        : ""
                                }
                            >
                                تم الشحن
                            </option>

                            <option
                                value="completed"
                                ${
                                    status === "completed"
                                        ? "selected"
                                        : ""
                                }
                            >
                                مكتمل
                            </option>

                            <option
                                value="cancelled"
                                ${
                                    status === "cancelled"
                                        ? "selected"
                                        : ""
                                }
                            >
                                ملغي
                            </option>

                        </select>

                    </td>

                    <td>

                        <button
                            class="admin-action view"
                            onclick="viewOrder('${order.id}')"
                        >
                            التفاصيل
                        </button>

                    </td>

                </tr>
            `;

        }).join("");
}

/* =========================================================
   27) تغيير حالة الطلب
   ========================================================= */

async function updateOrderStatus(
    id,
    status
) {

    try {

        const {
            error
        } =
            await supabaseClient
                .from("orders")
                .update({
                    status: status
                })
                .eq("id", id);

        if (error) {
            throw error;
        }

        const order =
            allOrders.find(
                item =>
                    String(item.id) === String(id)
            );

        if (order) {
            order.status = status;
        }

        showNotification(
            "تم تحديث حالة الطلب.",
            "success"
        );

    } catch (error) {

        console.error(error);

        showNotification(
            "تعذر تحديث الطلب.",
            "error"
        );

        await loadOrders();
    }
}

/* =========================================================
   28) تفاصيل الطلب
   ========================================================= */

function viewOrder(id) {

    const order =
        allOrders.find(
            item =>
                String(item.id) === String(id)
        );

    if (!order) {
        return;
    }

    const total =
        Number(order.product_price || 0) *
        Number(order.quantity || 1);

    const details = `
اسم العميل:
${order.customer_name || "-"}

رقم الهاتف:
${order.customer_phone || "-"}

العنوان:
${order.customer_address || "-"}

المنتج:
${order.product_name || "-"}

الكمية:
${order.quantity || 1}

السعر:
${Number(order.product_price || 0).toFixed(2)} ₪

الإجمالي:
${total.toFixed(2)} ₪

ملاحظات:
${order.notes || "-"}
    `;

    alert(details);
}

/* =========================================================
   29) تحميل الرسائل
   ========================================================= */

async function loadMessages() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("messages")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        allMessages =
            Array.isArray(data)
                ? data
                : [];

        renderMessages();

    } catch (error) {

        console.error(
            "Messages error:",
            error
        );

        allMessages = [];

        renderMessages();
    }
}

/* =========================================================
   30) عرض الرسائل
   ========================================================= */

function renderMessages() {

    if (!messagesTable) {
        return;
    }

    let messages =
        [...allMessages];

    const search =
        searchMessagesInput
            ? searchMessagesInput.value
                .trim()
                .toLowerCase()
            : "";

    if (search) {

        messages =
            messages.filter(message => {

                const text = [
                    message.customer_name,
                    message.customer_phone,
                    message.message,
                    message.reply
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return text.includes(search);
            });
    }

    if (!messages.length) {

        messagesTable.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">
                    لا توجد رسائل.
                </td>
            </tr>
        `;

        return;
    }

    messagesTable.innerHTML =
        messages.map((message, index) => {

            const replied =
                Boolean(message.reply);

            return `
                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(
                                message.customer_name || "-"
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            message.customer_phone || "-"
                        )}
                    </td>

                    <td>
                        <div class="message-preview">
                            ${escapeHTML(
                                message.message || "-"
                            )}
                        </div>
                    </td>

                    <td>
                        ${
                            replied
                                ? `
                                <span class="status active">
                                    تم الرد
                                </span>
                                `
                                : `
                                <span class="status pending">
                                    بانتظار الرد
                                </span>
                                `
                        }
                    </td>

                    <td>
                        ${formatDate(
                            message.created_at
                        )}
                    </td>

                    <td>

                        <button
                            class="admin-action reply"
                            onclick="openConversation('${message.id}')"
                        >
                            ${
                                replied
                                    ? "عرض"
                                    : "الرد"
                            }
                        </button>

                    </td>

                </tr>
            `;

        }).join("");
}

/* =========================================================
   31) فتح محادثة
   ========================================================= */

function openConversation(id) {

    const message =
        allMessages.find(
            item =>
                String(item.id) === String(id)
        );

    if (!message) {
        return;
    }

    currentConversation =
        message;

    if (currentMessageId) {
        currentMessageId.value =
            message.id;
    }

    if (currentCustomerName) {
        currentCustomerName.textContent =
            message.customer_name || "-";
    }

    if (currentCustomerPhone) {
        currentCustomerPhone.textContent =
            message.customer_phone || "-";
    }

    if (replyMessageText) {
        replyMessageText.value =
            message.reply || "";
    }

    const original =
        document.getElementById(
            "originalCustomerMessage"
        );

    if (original) {

        original.textContent =
            message.message || "";
    }

    if (messageReplyBox) {

        messageReplyBox.style.display =
            "block";

        messageReplyBox.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

/* =========================================================
   32) إغلاق صندوق الرد
   ========================================================= */

function closeMessageReply() {

    currentConversation = null;

    if (messageReplyBox) {
        messageReplyBox.style.display =
            "none";
    }

    if (replyMessageText) {
        replyMessageText.value = "";
    }
}

/* =========================================================
   33) إرسال الرد
   ========================================================= */

async function sendAdminReply(event) {

    if (event) {
        event.preventDefault();
    }

    if (!currentConversation) {

        showNotification(
            "اختر رسالة أولاً.",
            "error"
        );

        return;
    }

    const reply =
        replyMessageText
            ? replyMessageText.value.trim()
            : "";

    if (!reply) {

        showNotification(
            "اكتب الرد أولاً.",
            "error"
        );

        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient
                .from("messages")
                .update({
                    reply: reply,
                    replied_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    currentConversation.id
                );

        if (error) {
            throw error;
        }

        showNotification(
            "تم إرسال الرد.",
            "success"
        );

        closeMessageReply();

        await loadMessages();

        updateStatistics();

    } catch (error) {

        console.error(error);

        showNotification(
            "تعذر إرسال الرد.",
            "error"
        );
    }
}

/* =========================================================
   34) الإحصائيات
   ========================================================= */

function updateStatistics() {

    const totalProducts =
        allProducts.length;

    const activeProducts =
        allProducts.filter(
            product =>
                product.is_active !== false
        ).length;

    const totalOrders =
        allOrders.length;

    const totalMessages =
        allMessages.length;

    if (productsCount) {
        productsCount.textContent =
            totalProducts;
    }

    if (activeProductsCount) {
        activeProductsCount.textContent =
            activeProducts;
    }

    if (ordersCount) {
        ordersCount.textContent =
            totalOrders;
    }

    if (messagesCount) {
        messagesCount.textContent =
            totalMessages;
    }
}

/* =========================================================
   35) تنسيق التاريخ
   ========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString(
        "ar-PS",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

/* =========================================================
   36) البحث في المنتجات
   ========================================================= */

if (searchProductsInput) {

    searchProductsInput.addEventListener(
        "input",
        renderProducts
    );
}

/* =========================================================
   37) البحث في الطلبات
   ========================================================= */

if (searchOrdersInput) {

    searchOrdersInput.addEventListener(
        "input",
        renderOrders
    );
}

/* =========================================================
   38) البحث في الرسائل
   ========================================================= */

if (searchMessagesInput) {

    searchMessagesInput.addEventListener(
        "input",
        renderMessages
    );
}

/* =========================================================
   39) نموذج الدخول
   ========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        loginAdmin
    );
}

/* =========================================================
   40) زر تسجيل الخروج
   ========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logoutAdmin
    );
}

/* =========================================================
   41) نموذج المنتج
   ========================================================= */

if (productForm) {

    productForm.addEventListener(
        "submit",
        saveProduct
    );
}

/* =========================================================
   42) نموذج الرد
   ========================================================= */

const replyForm =
    document.getElementById(
        "replyForm"
    );

if (replyForm) {

    replyForm.addEventListener(
        "submit",
        sendAdminReply
    );
}

/* =========================================================
   43) أزرار التنقل
   ========================================================= */

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            "[data-admin-section]"
        );

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    button.dataset.adminSection;

                showAdminSection(target);

            }
        );

    });
}

/* =========================================================
   44) تغيير قسم لوحة الإدارة
   ========================================================= */

function showAdminSection(sectionName) {

    const sections =
        document.querySelectorAll(
            ".admin-section"
        );

    sections.forEach(section => {

        section.classList.remove(
            "active-section"
        );

        section.style.display =
            "none";
    });

    const target =
        document.getElementById(
            sectionName
        );

    if (target) {

        target.style.display =
            "block";

        target.classList.add(
            "active-section"
        );
    }

    const buttons =
        document.querySelectorAll(
            "[data-admin-section]"
        );

    buttons.forEach(button => {

        button.classList.remove(
            "active"
        );

        if (
            button.dataset.adminSection ===
            sectionName
        ) {

            button.classList.add(
                "active"
            );
        }
    });
}

/* =========================================================
   45) تحديث البيانات
   ========================================================= */

async function refreshDashboard() {

    showNotification(
        "جارٍ تحديث البيانات...",
        "success"
    );

    await loadAllData();

    showNotification(
        "تم تحديث البيانات.",
        "success"
    );
}

/* =========================================================
   46) الاستماع لتغييرات تسجيل الدخول
   ========================================================= */

function setupAuthListener() {

    if (!supabaseClient) {
        return;
    }

    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            if (
                event === "SIGNED_IN" &&
                session
            ) {

                currentUser =
                    session.user;

            }

            if (
                event === "SIGNED_OUT"
            ) {

                currentUser = null;

                showLogin();
            }

        }
    );
}

/* =========================================================
   47) Realtime للمنتجات
   ========================================================= */

function setupRealtime() {

    if (!supabaseClient) {
        return;
    }

    supabaseClient
        .channel(
            "nova-store-admin"
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "products"
            },
            async () => {

                await loadProducts();

                updateStatistics();
            }
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "orders"
            },
            async () => {

                await loadOrders();

                updateStatistics();
            }
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "messages"
            },
            async () => {

                await loadMessages();

                updateStatistics();
            }
        )
        .subscribe();
}

/* =========================================================
   48) تشغيل لوحة الإدارة
   ========================================================= */

async function initializeAdmin() {

    setupNavigation();

    if (!checkSupabase()) {
        showLogin();
        return;
    }

    setupAuthListener();

    setupRealtime();

    await checkSession();
}

/* =========================================================
   49) دوال عامة للـ HTML
   ========================================================= */

window.loginAdmin =
    loginAdmin;

window.logoutAdmin =
    logoutAdmin;

window.editProduct =
    editProduct;

window.deleteProduct =
    deleteProduct;

window.toggleProduct =
    toggleProduct;

window.updateOrderStatus =
    updateOrderStatus;

window.viewOrder =
    viewOrder;

window.openConversation =
    openConversation;

window.closeMessageReply =
    closeMessageReply;

window.sendAdminReply =
    sendAdminReply;

window.resetProductForm =
    resetProductForm;

window.refreshDashboard =
    refreshDashboard;

window.showAdminSection =
    showAdminSection;

/* =========================================================
   50) التشغيل بعد تحميل الصفحة
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeAdmin();

    }
);

/* =========================================================
   نهاية ملف NOVA STORE ADMIN.JS
   ========================================================= */
