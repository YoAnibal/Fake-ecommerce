const CURRENCY = "USD";
const BRAND = "Urban Basics";


function pushEcommerceEvent(eventName, ecommerceData) {
  window.dataLayer = window.dataLayer || [];

  // Clear previous ecommerce object
  window.dataLayer.push({
    ecommerce: null
  });

  // Push new ecommerce event
  window.dataLayer.push({
    event: eventName,
    ecommerce: ecommerceData
  });
}


function createGa4Item(
  product,
  quantity = 1,
  index,
  listId,
  listName
) {
  const item = {
    item_id: product.id,
    item_name: product.name,
    item_brand: BRAND,
    item_category: product.category,
    price: product.price,
    quantity: quantity
  };

  if (index !== undefined) {
    item.index = index;
  }

  if (listId) {
    item.item_list_id = listId;
  }

  if (listName) {
    item.item_list_name = listName;
  }

  return item;
}


function pushViewItemList(
  listProducts,
  listId,
  listName
) {
  pushEcommerceEvent(
    "view_item_list",
    {
      item_list_id: listId,
      item_list_name: listName,

      items: listProducts.map(
        (product, index) =>
          createGa4Item(
            product,
            1,
            index,
            listId,
            listName
          )
      )
    }
  );
}


function trackSelectItem(
  productId,
  listId,
  listName,
  index
) {
  const product =
    products.find(
      product =>
        product.id === productId
    );


  if (!product) return;


  sessionStorage.setItem(
    "lastSelectedItem",
    JSON.stringify({
      productId: productId,
      listId: listId,
      listName: listName,
      index: index
    })
  );


  pushEcommerceEvent(
    "select_item",
    {
      item_list_id: listId,
      item_list_name: listName,

      items: [
        createGa4Item(
          product,
          1,
          index,
          listId,
          listName
        )
      ]
    }
  );
}


function getCart() {
  return JSON.parse(
    localStorage.getItem("cart")
  ) || [];
}


function saveCart(cart) {
  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );
}


function getCartEcommerceData() {
  const cart =
    getCart();


  let value = 0;

  const items = [];


  cart.forEach(
    cartItem => {

      const product =
        products.find(
          product =>
            product.id ===
            cartItem.id
        );


      if (!product) return;


      value +=
        product.price *
        cartItem.quantity;


      items.push(
        createGa4Item(
          product,
          cartItem.quantity
        )
      );
    }
  );


  return {
    value:
      Number(
        value.toFixed(2)
      ),

    items:
      items
  };
}


function generateTransactionId() {

  // Preferred method in modern browsers
  if (
    window.crypto &&
    crypto.randomUUID
  ) {
    return (
      "UB-" +
      crypto.randomUUID()
    );
  }


  // Fallback
  return (
    "UB-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase()
  );
}


function addToCart(
  productId,
  listId,
  listName,
  index
) {
  const cart =
    getCart();


  const item =
    cart.find(
      product =>
        product.id === productId
    );


  if (item) {

    item.quantity += 1;

  } else {

    cart.push({
      id: productId,
      quantity: 1
    });
  }


  saveCart(cart);


  const product =
    products.find(
      product =>
        product.id === productId
    );


  if (!product) return;


  // If the add happens from the PDP,
  // recover list attribution
  if (!listId) {

    const storedSelection =
      sessionStorage.getItem(
        "lastSelectedItem"
      );


    if (storedSelection) {

      const selection =
        JSON.parse(
          storedSelection
        );


      if (
        selection.productId ===
        productId
      ) {

        listId =
          selection.listId;

        listName =
          selection.listName;

        index =
          selection.index;
      }
    }
  }


  // GA4 - add to cart
  pushEcommerceEvent(
    "add_to_cart",
    {
      currency:
        CURRENCY,

      value:
        product.price,

      items: [
        createGa4Item(
          product,
          1,
          index,
          listId,
          listName
        )
      ]
    }
  );


  alert(
    "Producto añadido al carrito"
  );
}


function removeFromCart(
  productId
) {
  const cart =
    getCart();


  const cartItem =
    cart.find(
      item =>
        item.id === productId
    );


  if (!cartItem) return;


  const product =
    products.find(
      product =>
        product.id === productId
    );


  if (!product) return;


  const removedQuantity =
    cartItem.quantity;


  const removedValue =
    product.price *
    removedQuantity;


  // GA4 - remove from cart
  pushEcommerceEvent(
    "remove_from_cart",
    {
      currency:
        CURRENCY,

      value:
        removedValue,

      items: [
        createGa4Item(
          product,
          removedQuantity
        )
      ]
    }
  );


  const updatedCart =
    cart.filter(
      item =>
        item.id !== productId
    );


  saveCart(
    updatedCart
  );


  // Update cart without
  // sending another view_cart
  renderCart(false);
}


function renderProducts() {
  const grid =
    document.getElementById(
      "productsGrid"
    );


  if (!grid) return;


  const params =
    new URLSearchParams(
      window.location.search
    );


  const category =
    params.get(
      "category"
    );


  let filteredProducts =
    products;


  let listId =
    "all_products";


  let listName =
    "Todos los productos";


  if (category) {

    filteredProducts =
      products.filter(
        product =>
          product.category ===
          category
      );


    listId =
      "category_" +
      category.toLowerCase();


    listName =
      category;
  }


  grid.innerHTML =
    filteredProducts
      .map(
        (product, index) => `
          <div class="card">

            <img
              src="${product.image}"
              alt="${product.name}"
            >

            <h3>
              ${product.name}
            </h3>

            <p>
              ${product.category}
            </p>

            <p>
              $${product.price}
            </p>

            <a
              class="btn"
              href="product.html?id=${product.id}"
              onclick="trackSelectItem(
                '${product.id}',
                '${listId}',
                '${listName}',
                ${index}
              )"
            >
              Ver detalle
            </a>

            <button
              onclick="addToCart(
                '${product.id}',
                '${listId}',
                '${listName}',
                ${index}
              )"
            >
              Añadir al carrito
            </button>

          </div>
        `
      )
      .join("");


  // GA4 - product list view
  pushViewItemList(
    filteredProducts,
    listId,
    listName
  );
}


function renderProductDetail() {
  const container =
    document.getElementById(
      "productDetail"
    );


  if (!container) return;


  const params =
    new URLSearchParams(
      window.location.search
    );


  const id =
    params.get("id");


  const product =
    products.find(
      item =>
        item.id === id
    );


  if (!product) {

    container.innerHTML =
      "<p>Producto no encontrado.</p>";

    return;
  }


  container.innerHTML = `
    <div class="card">

      <img
        src="${product.image}"
        alt="${product.name}"
      >

      <h2>
        ${product.name}
      </h2>

      <p>
        Categoría:
        ${product.category}
      </p>

      <p>
        Precio:
        $${product.price}
      </p>

      <p>
        Producto ficticio para practicar ecommerce tracking.
      </p>

      <button
        onclick="addToCart('${product.id}')"
      >
        Añadir al carrito
      </button>

    </div>
  `;


  let listId;
  let listName;
  let index;


  const storedSelection =
    sessionStorage.getItem(
      "lastSelectedItem"
    );


  if (storedSelection) {

    const selection =
      JSON.parse(
        storedSelection
      );


    if (
      selection.productId ===
      product.id
    ) {

      listId =
        selection.listId;

      listName =
        selection.listName;

      index =
        selection.index;
    }
  }


  // GA4 - product detail
  pushEcommerceEvent(
    "view_item",
    {
      currency:
        CURRENCY,

      value:
        product.price,

      items: [
        createGa4Item(
          product,
          1,
          index,
          listId,
          listName
        )
      ]
    }
  );
}


function renderCart(
  trackView = true
) {
  const container =
    document.getElementById(
      "cartItems"
    );


  const totalContainer =
    document.getElementById(
      "cartTotal"
    );


  if (!container) return;


  const cart =
    getCart();


  if (
    cart.length === 0
  ) {

    container.innerHTML =
      "<p>Tu carrito está vacío.</p>";

    totalContainer.innerHTML =
      "";

    return;
  }


  let total = 0;

  const ga4Items = [];


  container.innerHTML =
    cart
      .map(
        item => {

          const product =
            products.find(
              p =>
                p.id === item.id
            );


          const subtotal =
            product.price *
            item.quantity;


          total += subtotal;


          ga4Items.push(
            createGa4Item(
              product,
              item.quantity
            )
          );


          return `
            <div class="card">

              <h3>
                ${product.name}
              </h3>

              <p>
                Cantidad:
                ${item.quantity}
              </p>

              <p>
                Subtotal:
                $${subtotal.toFixed(2)}
              </p>

              <button
                onclick="removeFromCart('${product.id}')"
              >
                Eliminar
              </button>

            </div>
          `;
        }
      )
      .join("");


  totalContainer.innerHTML =
    "Total: $" +
    total.toFixed(2);


  // GA4 - view cart
  if (trackView) {

    pushEcommerceEvent(
      "view_cart",
      {
        currency:
          CURRENCY,

        value:
          Number(
            total.toFixed(2)
          ),

        items:
          ga4Items
      }
    );
  }
}


function setupCheckout() {
  const form =
    document.getElementById(
      "checkoutForm"
    );


  if (!form) return;


  const cart =
    getCart();


  // -----------------------------
  // BEGIN CHECKOUT
  // -----------------------------

  if (
    cart.length > 0
  ) {

    const checkoutData =
      getCartEcommerceData();


    if (
      checkoutData.items.length > 0
    ) {

      const checkoutCartKey =
        cart
          .map(
            item =>
              `${item.id}:${item.quantity}`
          )
          .sort()
          .join("|");


      const previousCheckoutCartKey =
        sessionStorage.getItem(
          "checkoutStartedCart"
        );


      if (
        previousCheckoutCartKey !==
        checkoutCartKey
      ) {

        pushEcommerceEvent(
          "begin_checkout",
          {
            currency:
              CURRENCY,

            value:
              checkoutData.value,

            items:
              checkoutData.items
          }
        );


        sessionStorage.setItem(
          "checkoutStartedCart",
          checkoutCartKey
        );
      }
    }
  }


  // -----------------------------
  // SHIPPING + PAYMENT SELECTS
  // -----------------------------

  const selects =
    form.querySelectorAll(
      "select"
    );


  const shippingSelect =
    selects[0];


  const paymentSelect =
    selects[1];


  // -----------------------------
  // ADD SHIPPING INFO
  // -----------------------------

  if (shippingSelect) {

    shippingSelect.addEventListener(
      "change",
      function() {

        const shippingTier =
          shippingSelect.value;


        if (!shippingTier) {
          return;
        }


        const checkoutData =
          getCartEcommerceData();


        if (
          checkoutData.items.length ===
          0
        ) {
          return;
        }


        pushEcommerceEvent(
          "add_shipping_info",
          {
            currency:
              CURRENCY,

            value:
              checkoutData.value,

            shipping_tier:
              shippingTier,

            items:
              checkoutData.items
          }
        );
      }
    );
  }


  // -----------------------------
  // ADD PAYMENT INFO
  // -----------------------------

  if (paymentSelect) {

    paymentSelect.addEventListener(
      "change",
      function() {

        const paymentType =
          paymentSelect.value;


        if (!paymentType) {
          return;
        }


        const checkoutData =
          getCartEcommerceData();


        if (
          checkoutData.items.length ===
          0
        ) {
          return;
        }


        pushEcommerceEvent(
          "add_payment_info",
          {
            currency:
              CURRENCY,

            value:
              checkoutData.value,

            payment_type:
              paymentType,

            items:
              checkoutData.items
          }
        );
      }
    );
  }


  // -----------------------------
  // COMPLETE ORDER
  // -----------------------------

  form.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();


      // IMPORTANT:
      // Read the cart BEFORE deleting it
      const purchaseData =
        getCartEcommerceData();


      if (
        purchaseData.items.length ===
        0
      ) {

        alert(
          "Tu carrito está vacío."
        );

        return;
      }


      // Generate a unique order ID
      const transactionId =
        generateTransactionId();


      // Save the completed order temporarily.
      // thank-you.html will use this data
      // to send the purchase event.
      const completedOrder = {

        transaction_id:
          transactionId,

        currency:
          CURRENCY,

        value:
          purchaseData.value,

        items:
          purchaseData.items

      };


      sessionStorage.setItem(
        "lastOrder",
        JSON.stringify(
          completedOrder
        )
      );


      // Remove possible previous purchase marker
      // so this NEW transaction can be tracked
      sessionStorage.removeItem(
        "trackedPurchaseId"
      );


      // Reset begin_checkout state
      sessionStorage.removeItem(
        "checkoutStartedCart"
      );


      // Now we can safely clear the cart
      localStorage.removeItem(
        "cart"
      );


      // Go to confirmation page
      window.location.href =
        "thank-you.html";
    }
  );
}


function trackPurchase() {
  const orderElement =
    document.getElementById(
      "orderId"
    );


  // This function should only run
  // on thank-you.html
  if (!orderElement) {
    return;
  }


  const storedOrder =
    sessionStorage.getItem(
      "lastOrder"
    );


  if (!storedOrder) {

    orderElement.textContent =
      "No disponible";

    return;
  }


  let order;


  try {

    order =
      JSON.parse(
        storedOrder
      );

  } catch (error) {

    return;
  }


  if (
    !order.transaction_id ||
    !order.items ||
    order.items.length === 0
  ) {
    return;
  }


  // Display the real generated order ID
  orderElement.textContent =
    order.transaction_id;


  const trackedPurchaseId =
    sessionStorage.getItem(
      "trackedPurchaseId"
    );


  // Prevent duplicate purchase on refresh
  if (
    trackedPurchaseId ===
    order.transaction_id
  ) {
    return;
  }


  // GA4 - purchase
  pushEcommerceEvent(
    "purchase",
    {
      transaction_id:
        order.transaction_id,

      currency:
        order.currency,

      value:
        order.value,

      items:
        order.items
    }
  );


  // Mark this transaction as already tracked
  sessionStorage.setItem(
    "trackedPurchaseId",
    order.transaction_id
  );
}


function setupNewsletter() {
  const form =
    document.getElementById(
      "newsletterForm"
    );


  if (!form) return;


  form.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();


      alert(
        "Gracias por suscribirte"
      );


      form.reset();
    }
  );
}


function setupSearch() {
  const searchInput =
    document.getElementById(
      "searchInput"
    );


  const grid =
    document.getElementById(
      "productsGrid"
    );


  if (
    !searchInput ||
    !grid
  ) {
    return;
  }


  searchInput.addEventListener(
    "input",
    function() {

      const query =
        searchInput.value
          .toLowerCase()
          .trim();


      const results =
        products.filter(
          product =>

            product.name
              .toLowerCase()
              .includes(query)

            ||

            product.category
              .toLowerCase()
              .includes(query)
        );


      const listId =
        query
          ? "search_results"
          : "all_products";


      const listName =
        query
          ? "Resultados de búsqueda"
          : "Todos los productos";


      grid.innerHTML =
        results
          .map(
            (product, index) => `
              <div class="card">

                <img
                  src="${product.image}"
                  alt="${product.name}"
                >

                <h3>
                  ${product.name}
                </h3>

                <p>
                  ${product.category}
                </p>

                <p>
                  $${product.price}
                </p>

                <a
                  class="btn"
                  href="product.html?id=${product.id}"
                  onclick="trackSelectItem(
                    '${product.id}',
                    '${listId}',
                    '${listName}',
                    ${index}
                  )"
                >
                  Ver detalle
                </a>

                <button
                  onclick="addToCart(
                    '${product.id}',
                    '${listId}',
                    '${listName}',
                    ${index}
                  )"
                >
                  Añadir al carrito
                </button>

              </div>
            `
          )
          .join("");
    }
  );
}


renderProducts();
renderProductDetail();
renderCart();
setupCheckout();
trackPurchase();
setupNewsletter();
setupSearch();
