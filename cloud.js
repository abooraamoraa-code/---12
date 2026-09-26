/*
=========================================================
NOVA STORE - CLOUD LAYER
=========================================================

هذا الملف هو الوسيط بين واجهة NOVA STORE
وخدمة قاعدة البيانات السحابية.

حاليًا نستخدم Appwrite.

مهم:
لا تضع أي Secret Key داخل هذا الملف.
الـ API Key السري لا يوضع أبدًا في ملفات المتصفح.
=========================================================
*/


/* =====================================================
   1. إعدادات Appwrite
   ===================================================== */

/*
   سنضع القيم الحقيقية لاحقًا بعد إنشاء مشروع Appwrite.

   لا تحتاج إلى تغيير أي شيء الآن.
*/

const NOVA_CLOUD_CONFIG = {

    endpoint: "",

    projectId: "",

    databaseId: "",

    productsCollectionId: "",

    ordersCollectionId: "",

    messagesCollectionId: ""

};


/* =====================================================
   2. حالة الاتصال
   ===================================================== */

let novaCloudReady = false;

let novaCloudClient = null;

let novaCloudDatabases = null;

let novaCloudAccount = null;


/* =====================================================
   3. البحث عن Appwrite
   ===================================================== */

function novaCloudCheckLibrary() {

    if (
        typeof window === "undefined"
    ) {
        return false;
    }

    if (
        !window.Appwrite
    ) {
        console.warn(
            "Appwrite SDK غير موجود في الصفحة."
        );

        return false;
    }

    return true;
}


/* =====================================================
   4. تهيئة Appwrite
   ===================================================== */

function novaCloudInitialize() {

    if (
        !novaCloudCheckLibrary()
    ) {

        console.warn(
            "لم يتم العثور على Appwrite SDK."
        );

        return false;
    }


    if (
        !NOVA_CLOUD_CONFIG.endpoint ||
        !NOVA_CLOUD_CONFIG.projectId
    ) {

        console.warn(
            "لم يتم وضع إعدادات Appwrite بعد."
        );

        return false;
    }


    try {

        novaCloudClient =
            new Appwrite.Client();


        novaCloudClient
            .setEndpoint(
                NOVA_CLOUD_CONFIG.endpoint
            );


        novaCloudClient
            .setProject(
                NOVA_CLOUD_CONFIG.projectId
            );


        novaCloudDatabases =
            new Appwrite.Databases(
                novaCloudClient
            );


        novaCloudAccount =
            new Appwrite.Account(
                novaCloudClient
            );


        novaCloudReady = true;


        console.log(
            "NOVA CLOUD جاهز."
        );


        return true;

    } catch (error) {

        console.error(
            "خطأ في تشغيل NOVA CLOUD:",
            error
        );

        novaCloudReady = false;

        return false;
    }
}


/* =====================================================
   5. التحقق من الاتصال
   ===================================================== */

function novaCloudIsReady() {

    return (
        novaCloudReady &&
        novaCloudClient !== null
    );
}


/* =====================================================
   6. الحصول على الإعدادات
   ===================================================== */

function novaCloudGetConfig() {

    return {
        ...NOVA_CLOUD_CONFIG
    };
}


/* =====================================================
   7. أدوات النصوص
   ===================================================== */

function novaCloudCleanText(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(
        value
    ).trim();
}


/* =====================================================
   8. تحويل السعر
   ===================================================== */

function novaCloudPrice(
    value
) {

    const price =
        Number(value);


    if (
        Number.isNaN(price)
    ) {

        return 0;
    }


    if (
        price < 0
    ) {

        return 0;
    }


    return Number(
        price.toFixed(2)
    );
}


/* =====================================================
   9. تحويل المنتج إلى الشكل الموحد
   ===================================================== */

function novaCloudNormalizeProduct(
    document
) {

    if (!document) {
        return null;
    }


    const data =
        document.data || document;


    return {

        id:
            document.$id ||
            data.id ||
            "",

        name:
            data.name ||
            "",

        description:
            data.description ||
            "",

        price:
            novaCloudPrice(
                data.price
            ),

        category:
            data.category ||
            "",

        image_url:
            data.image_url ||
            "",

        is_active:
            data.is_active !== false,

        created_at:
            document.$createdAt ||
            data.created_at ||
            null,

        updated_at:
            document.$updatedAt ||
            data.updated_at ||
            null
    };
}


/* =====================================================
   10. الحصول على المنتجات
   ===================================================== */

async function novaCloudGetProducts(
    options = {}
) {

    if (
        !novaCloudIsReady()
    ) {

        return {
            success: false,
            data: [],
            error:
                "NOVA CLOUD غير جاهز."
        };
    }


    try {

        const queries = [];


        /*
          عرض المنتجات النشطة فقط
        */

        if (
            options.activeOnly !== false
        ) {

            queries.push(
                Appwrite.Query.equal(
                    "is_active",
                    true
                )
            );
        }


        /*
          ترتيب المنتجات
        */

        queries.push(
            Appwrite.Query.orderDesc(
                "$createdAt"
            )
        );


        /*
          الحد الأقصى
        */

        if (
            options.limit
        ) {

            queries.push(
                Appwrite.Query.limit(
                    Number(
                        options.limit
                    )
                )
            );
        }


        const response =
            await novaCloudDatabases
                .listDocuments(
                    NOVA_CLOUD_CONFIG.databaseId,
                    NOVA_CLOUD_CONFIG.productsCollectionId,
                    queries
                );


        const products =
            Array.isArray(
                response.documents
            )
                ? response.documents.map(
                    novaCloudNormalizeProduct
                )
                : [];


        return {

            success: true,

            data: products,

            total:
                response.total || 0,

            error: null
        };


    } catch (error) {

        console.error(
            "Get products error:",
            error
        );


        return {

            success: false,

            data: [],

            total: 0,

            error:
                error.message ||
                "تعذر تحميل المنتجات."
        };
    }
}


/* =====================================================
   11. الحصول على منتج واحد
   ===================================================== */

async function novaCloudGetProduct(
    id
) {

    if (
        !novaCloudIsReady()
    ) {

        return {
            success: false,
            data: null,
            error:
                "NOVA CLOUD غير جاهز."
        };
    }


    if (!id) {

        return {
            success: false,
            data: null,
            error:
                "معرف المنتج غير موجود."
        };
    }


    try {

        const document =
            await novaCloudDatabases
                .getDocument(
                    NOVA_CLOUD_CONFIG.databaseId,
                    NOVA_CLOUD_CONFIG.productsCollectionId,
                    id
                );


        return {

            success: true,

            data:
                novaCloudNormalizeProduct(
                    document
                ),

            error: null
        };


    } catch (error) {

        console.error(
            "Get product error:",
            error
        );


        return {

            success: false,

            data: null,

            error:
                error.message ||
                "تعذر الحصول على المنتج."
        };
    }
}


/* =====================================================
   12. إضافة منتج
   ===================================================== */

async function novaCloudCreateProduct(
    product
) {

    if (
        !novaCloudIsReady()
    ) {

        return {
            success: false,
            data: null,
            error:
                "NOVA CLOUD غير جاهز."
        };
    }


    const name =
        novaCloudCleanText(
            product.name
        );


    if (!name) {

        return {

            success: false,

            data: null,

            error:
                "اسم المنتج مطلوب."
        };
    }


    const payload = {

        name: name,

        description:
            novaCloudCleanText(
                product.description
            ),

        price:
            novaCloudPrice(
                product.price
            ),

        category:
            novaCloudCleanText(
                product.category
            ),

        image_url:
            novaCloudCleanText(
                product.image_url
            ),

        is_active:
            product.is_active !== false
    };


    try {

        const document =
            await novaCloudDatabases
                .createDocument(
                    NOVA_CLOUD_CONFIG.databaseId,

                    NOVA_CLOUD_CONFIG.productsCollectionId,

                    Appwrite.ID.unique(),

                    payload
                );


        return {

            success: true,

            data:
                novaCloudNormalizeProduct(
                    document
                ),

            error: null
        };


    } catch (error) {

        console.error(
            "Create product error:",
            error
        );


        return {

            success: false,

            data: null,

            error:
                error.message ||
                "تعذر إضافة المنتج."
        };
    }
}


/* =====================================================
   13. تعديل منتج
   ===================================================== */

async function novaCloudUpdateProduct(
    id,
    product
) {

    if (
        !novaCloudIsReady()
    ) {

        return {

            success: false,

            data: null,

            error:
                "NOVA CLOUD غير جاهز."
        };
    }


    if (!id) {

        return {

            success: false,

            data: null,

            error:
                "معرف المنتج غير موجود."
        };
    }


    const payload = {

        name:
            novaCloudCleanText(
                product.name
            ),

        description:
            novaCloudCleanText(
                product.description
            ),

        price:
            novaCloudPrice(
                product.price
            ),

        category:
            novaCloudCleanText(
                product.category
            ),

        image_url:
            novaCloudCleanText(
                product.image_url
            ),

        is_active:
            product.is_active !== false
    };


    try {

        const document =
            await novaCloudDatabases
                .updateDocument(
                    NOVA_CLOUD_CONFIG.databaseId,

                    NOVA_CLOUD_CONFIG.productsCollectionId,

                    id,

                    payload
                );


        return {

            success: true,

            data:
                novaCloudNormalizeProduct(
                    document
                ),

            error: null
        };


    } catch (error) {

        console.error(
            "Update product error:",
            error
        );


        return {

            success: false,

            data: null,

            error:
                error.message ||
                "تعذر تعديل المنتج."
        };
    }
}


/* =====================================================
   14. حذف منتج
   ===================================================== */

async function novaCloudDeleteProduct(
    id
) {

    if (
        !novaCloudIsReady()
    ) {

        return {

            success: false,

            error:
                "NOVA CLOUD غير جاهز."
        };
    }


    try {

        await novaCloudDatabases
            .deleteDocument(
                NOVA_CLOUD_CONFIG.databaseId,

                NOVA_CLOUD_CONFIG.productsCollectionId,

                id
            );


        return {

            success: true,

            error: null
        };


    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );


        return {

            success: false,

            error:
                error.message ||
                "تعذر حذف المنتج."
        };
    }
}


/* =====================================================
   15. تفعيل / إخفاء منتج
   ===================================================== */

async function novaCloudToggleProduct(
    id,
    active
) {

    return novaCloudUpdateProduct(
        id,
        {
            is_active:
                Boolean(active)
        }
    );
}


/* =====================================================
   16. إنشاء طلب
   ===================================================== */

async function novaCloudCreateOrder(
    order
) {

    if (
        !novaCloudIsReady()
    ) {

        return {

            success: false,

            data: null,

            error:
                "NOVA CLOUD غير جاهز."
        };
    }


    const payload = {

        product_id:
            novaCloudCleanText(
                order.product_id
            ),

        product_name:
            novaCloudCleanText(
                order.product_name
            ),

        product_price:
            novaCloudPrice(
                order.product_price
            ),

        customer_name:
            novaCloudCleanText(
                order.customer_name
            ),

        customer_phone:
            novaCloudCleanText(
                order.customer_phone
            ),

        customer_address:
            novaCloudCleanText(
                order.customer_address
            ),

        quantity:
            Math.max(
                1,
                Number(
                    order.quantity || 1
                )
            ),

        notes:
            novaCloudCleanText(
                order.notes
            ),

        status:
            "new"
    };


    try {

        const document =
            await novaCloudDatabases
                .createDocument(
                    NOVA_CLOUD_CONFIG.databaseId,

                    NOVA_CLOUD_CONFIG.ordersCollectionId,

                    Appwrite.ID.unique(),

                    payload
                );


        return {

            success: true,

            data:
                document,

            error: null
        };


    } catch (error) {

        console.error(
            "Create order error:",
            error
        );


        return {

            success: false,

            data: null,

            error:
                error.message ||
                "تعذر إرسال الطلب."
        };
    }
}


/* =====================================================
   17. الحصول على الطلبات
   ===================================================== */

async function novaCloudGetOrders(
    options = {}
) {

    if (
        !novaCloudIsReady()
    ) {

        return {

            success: false,

            data: [],

            error:
                "NOVA CLOUD غير جاهز."
        };
    }


    try {

        const queries = [

            Appwrite.Query.orderDesc(
                "$createdAt"
            )

        ];


        if (
            options.limit
        ) {

            queries.push(
                Appwrite.Query.limit(
                    Number(
                        options.limit
                    )
                )
            );
        }


        const response =
            await novaCloudDatabases
                .listDocuments(
                    NOVA_CLOUD_CONFIG.databaseId,

                    NOVA_CLOUD_CONFIG.ordersCollectionId,

                    queries
                );


        return {

            success: true,

            data:
                response.documents || [],

            total:
                response.total || 0,

            error: null
        };


    } catch (error) {

        console.error(
            "Get orders error:",
            error
        );


        return {

            success: false,

            data: [],

            total: 0,

            error:
                error.message ||
                "تعذر تحميل الطلبات."
        };
    }
}


/* =====================================================
   18. تغيير حالة الطلب
   ===================================================== */

async function novaCloudUpdateOrderStatus(
    id,
    status
) {

    if (
        !novaCloudIsReady()
    ) {

        return {

            success: false,

            error:
                "NOVA CLOUD غير جاهز."
        };
    }


    const allowedStatuses = [

        "new",

        "processing",

        "shipped",

        "completed",

        "cancelled"

    ];


    if (
        !allowedStatuses.includes(
            status
        )
    ) {

        return {

            success: false,

            error:
                "حالة الطلب غير صحيحة."
        };
    }


    try {

        const document =
            await novaCloudDatabases
                .updateDocument(

                    NOVA_CLOUD_CONFIG.databaseId,

                    NOVA_CLOUD_CONFIG.ordersCollectionId,

                    id,

                    {
                        status: status
                    }

                );


        return {

            success: true,

            data: document,

            error: null
        };


    } catch (error) {

        console.error(
            "Update order status error:",
            error
        );


        return {

            success: false,

            error:
                error.message ||
                "تعذر تحديث حالة الطلب."
        };
    }
}


/* =====================================================
   19. إرسال رسالة من العميل
   ===================================================== */

async function novaCloudCreateMessage(
    message
) {

    if (
        !novaCloudIsReady()
    ) {

        return {

            success: false,

            data: null,

            error:
                "NOVA CLOUD غير جاهز."
        };
    }


    const payload = {

        customer_name:
            novaCloudCleanText(
                message.customer_name
            ),

        customer_phone:
            novaCloudCleanText(
                message.customer_phone
            ),

        message:
            novaCloudCleanText(
                message.message
            ),

        reply:
            "",

        replied_at:
            null
    };


    if (!payload.message) {

        return {

            success: false,

            data: null,

            error:
                "اكتب الرسالة أولاً."
        };
    }


    try {

        const document =
            await novaCloudDatabases
                .createDocument(

                    NOVA_CLOUD_CONFIG.databaseId,

                    NOVA_CLOUD_CONFIG.messagesCollectionId,

                    Appwrite.ID.unique(),

                    payload
                );


        return {

            success: true,

            data: document,

            error: null
        };


    } catch (error) {

        console.error(
            "Create message error:",
            error
        );


        return {

            success: false,

            data: null,

            error:
                error.message ||
                "تعذر إرسال الرسالة."
        };
    }
}


/* =====================================================
   20. الحصول على الرسائل
   ===================================================== */

async function novaCloudGetMessages(
    options = {}
) {

    if (
        !novaCloudIsReady()
    ) {

        return {

            success: false,

            data: [],

            error:
                "NOVA CLOUD غير جاهز."
        };
    }


    try {

        const queries = [

            Appwrite.Query.orderDesc(
                "$createdAt"
            )

        ];


        if (
            options.limit
        ) {

            queries.push(
                Appwrite.Query.limit(
                    Number(
                        options.limit
                    )
                )
            );
        }


        const response =
            await novaCloudDatabases
                .listDocuments(

                    NOVA_CLOUD_CONFIG.databaseId,

                    NOVA_CLOUD_CONFIG.messagesCollectionId,

                    queries

                );


        return {

            success: true,

            data:
                response.documents || [],

            total:
                response.total || 0,

            error: null
        };


    } catch (error) {

        console.error(
            "Get messages error:",
            error
        );


        return {

            success: false,

            data: [],

            total: 0,

            error:
                error.message ||
                "تعذر تحميل الرسائل."
        };
    }
}


/* =====================================================
   21. الرد على رسالة
   ===================================================== */

async function novaCloudReplyMessage(
    id,
    reply
) {

    if (
        !novaCloudIsReady()
    ) {

        return {

            success: false,

            error:
                "NOVA CLOUD غير جاهز."
        };
    }


    reply =
        novaCloudCleanText(
            reply
        );


    if (!reply) {

        return {

            success: false,

            error:
                "اكتب الرد أولاً."
        };
    }


    try {

        const document =
            await novaCloudDatabases
                .updateDocument(

                    NOVA_CLOUD_CONFIG.databaseId,

                    NOVA_CLOUD_CONFIG.messagesCollectionId,

                    id,

                    {

                        reply:
                            reply,

                        replied_at:
                            new Date()
                                .toISOString()

                    }

                );


        return {

            success: true,

            data: document,

            error: null
        };


    } catch (error) {

        console.error(
            "Reply message error:",
            error
        );


        return {

            success: false,

            error:
                error.message ||
                "تعذر إرسال الرد."
        };
    }
}


/* =====================================================
   22. تسجيل دخول المدير
   ===================================================== */

async function novaCloudLogin(
    email,
    password
) {

    if (
        !novaCloudAccount
    ) {

        return {

            success: false,

            data: null,

            error:
                "خدمة تسجيل الدخول غير جاهزة."
        };
    }


    try {

        const session =
            await novaCloudAccount
                .createEmailPasswordSession(
                    email,
                    password
                );


        return {

            success: true,

            data: session,

            error: null
        };


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        return {

            success: false,

            data: null,

            error:
                error.message ||
                "تعذر تسجيل الدخول."
        };
    }
}


/* =====================================================
   23. تسجيل خروج المدير
   ===================================================== */

async function novaCloudLogout() {

    if (
        !novaCloudAccount
    ) {

        return {

            success: false,

            error:
                "خدمة الحساب غير جاهزة."
        };
    }


    try {

        await novaCloudAccount
            .deleteSession(
                "current"
            );


        return {

            success: true,

            error: null
        };


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        return {

            success: false,

            error:
                error.message ||
                "تعذر تسجيل الخروج."
        };
    }
}


/* =====================================================
   24. الحصول على المدير الحالي
   ===================================================== */

async function novaCloudGetCurrentUser() {

    if (
        !novaCloudAccount
    ) {

        return {

            success: false,

            data: null,

            error:
                "خدمة الحساب غير جاهزة."
        };
    }


    try {

        const user =
            await novaCloudAccount
                .get();


        return {

            success: true,

            data: user,

            error: null
        };


    } catch (error) {

        return {

            success: false,

            data: null,

            error:
                error.message ||
                "لا يوجد مدير مسجل الدخول."
        };
    }
}


/* =====================================================
   25. إنشاء حساب مدير
   ===================================================== */

/*
   هذه الوظيفة للاستخدام الإداري فقط.

   لا تجعل الزوار يستخدمونها.
*/

async function novaCloudCreateAdmin(
    email,
    password,
    name = ""
) {

    if (
        !novaCloudAccount
    ) {

        return {

            success: false,

            data: null,

            error:
                "خدمة الحساب غير جاهزة."
        };
    }


    try {

        const user =
            await novaCloudAccount
                .create(
                    Appwrite.ID.unique(),
                    email,
                    password,
                    name
                );


        return {

            success: true,

            data: user,

            error: null
        };


    } catch (error) {

        console.error(
            "Create admin error:",
            error
        );


        return {

            success: false,

            data: null,

            error:
                error.message ||
                "تعذر إنشاء الحساب."
        };
    }
}


/* =====================================================
   26. إحصائيات المتجر
   ===================================================== */

async function novaCloudGetStatistics() {

    const [
        products,
        orders,
        messages
    ] =
        await Promise.all([

            novaCloudGetProducts({
                activeOnly: false
            }),

            novaCloudGetOrders(),

            novaCloudGetMessages()

        ]);


    return {

        success:
            products.success &&
            orders.success &&
            messages.success,

        products:
            products.data
                ? products.data.length
                : 0,

        activeProducts:
            products.data
                ? products.data.filter(
                    product =>
                        product.is_active !== false
                ).length
                : 0,

        orders:
            orders.data
                ? orders.data.length
                : 0,

        messages:
            messages.data
                ? messages.data.length
                : 0
    };
}


/* =====================================================
   27. فحص الاتصال السحابي
   ===================================================== */

async function novaCloudHealthCheck() {

    if (
        !novaCloudIsReady()
    ) {

        return {

            success: false,

            message:
                "NOVA CLOUD غير متصل."
        };
    }


    try {

        await novaCloudDatabases
            .listDocuments(

                NOVA_CLOUD_CONFIG.databaseId,

                NOVA_CLOUD_CONFIG.productsCollectionId,

                [
                    Appwrite.Query.limit(1)
                ]

            );


        return {

            success: true,

            message:
                "الاتصال بقاعدة البيانات يعمل."
        };


    } catch (error) {

        return {

            success: false,

            message:
                error.message ||
                "فشل الاتصال."
        };
    }
}


/* =====================================================
   28. واجهة عامة
   ===================================================== */

window.NOVA_CLOUD = {

    initialize:
        novaCloudInitialize,

    isReady:
        novaCloudIsReady,

    getConfig:
        novaCloudGetConfig,

    getProducts:
        novaCloudGetProducts,

    getProduct:
        novaCloudGetProduct,

    createProduct:
        novaCloudCreateProduct,

    updateProduct:
        novaCloudUpdateProduct,

    deleteProduct:
        novaCloudDeleteProduct,

    toggleProduct:
        novaCloudToggleProduct,

    createOrder:
        novaCloudCreateOrder,

    getOrders:
        novaCloudGetOrders,

    updateOrderStatus:
        novaCloudUpdateOrderStatus,

    createMessage:
        novaCloudCreateMessage,

    getMessages:
        novaCloudGetMessages,

    replyMessage:
        novaCloudReplyMessage,

    login:
        novaCloudLogin,

    logout:
        novaCloudLogout,

    getCurrentUser:
        novaCloudGetCurrentUser,

    createAdmin:
        novaCloudCreateAdmin,

    getStatistics:
        novaCloudGetStatistics,

    healthCheck:
        novaCloudHealthCheck

};


/* =====================================================
   29. تشغيل تلقائي
   ===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            () => {

                novaCloudInitialize();

            },
            100
        );

    }
);


/* =====================================================
   نهاية الملف
   ===================================================== */
