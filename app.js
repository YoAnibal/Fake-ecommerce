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


function pushViewItemList(listProducts, listId, listName) {
  pushEcommerceEvent("view_item_list", {
    item_list_id: listId,
    item_list_name: listName,
    items: listProducts.map((product, index) =>
      createGa4Item(
        product,
        1,
        index,
        listId,
        listName
      )
    )
  });
}


function trackSelectItem(productId, listId, listName, index) {
  const product = products.find(
    product => product.id === productId
  );

  if (!product) return;

  // Keep list context for the product detail page
  sessionStorage.setItem(
    "lastSelectedItem",
    JSON.stringify({
      productId: productId,
      listId: listId,
      listName: listName,
      index: index
    })
  );

  pushEcommerceEvent("select_item", {
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
  });
}


function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}


function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}


function addToCart(productId) {
  const cart = getCart();
  const item = cart.find(product => product.id === productId);

  if (item) {
    item.quantity += 1;
  } else {
    cart.push({
      id: productId,
      quantity: 1
    });
  }

  saveCart(cart);

  alert("Producto añadido al carrito");
}


function removeFromCart(productId) {
  let cart = getCart();

  cart = cart.filter(
    item => item.id !== productId
  );

  saveCart(cart);

  location.reload();
}


function renderProducts() {
  const grid = document.getElementById("productsGrid");

  if (!grid) return;

  const params = new URLSearchParams(
    window.location.search
  );

  const category = params.get("category");

  let filteredProducts = products;

  let listId = "all_products";
  let listName = "Todos los productos";


  // If the page is filtered by category,
  // use that category as the list context
  if (category) {

    filteredProducts = products.filter(
      product => product.category === category
    );

    listId =
      "category_" + category.toLowerCase();

    listName = category;
  }


  // Render products
  grid.innerHTML = filteredProducts.map(product => `
    <div class="card">

      <img
        src="${product.image}"
        alt="${product.name}"
      >

      <h3>${product.name}</h3>

      <p>${product.category}</p>

      <p>$${product.price}</p>

      <a
        class="btn"
        href="product.html?id=${product.id}"
      >
        Ver detalle
      </a>

      <button onclick="addToCart('${product.id}')">
        Añadir al carrito
      </button>

    </div>
  `).join("");


  // GA4 ecommerce - product list impression
  pushViewItemList(
    filteredProducts,
    listId,
    listName
  );
}


function renderProductDetail() {
  const container =
    document.getElementById("productDetail");

  if (!container) return;


  const params =
    new URLSearchParams(
      window.location.search
    );

  const id = params.get("id");

  const product = products.find(
    item => item.id === id
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

      <h2>${product.name}</h2>

      <p>
        Categoría: ${product.category}
      </p>

      <p>
        Precio: $${product.price}
      </p>

      <p>
        Producto ficticio para practicar ecommerce tracking.
      </p>

      <button onclick="addToCart('${product.id}')">
        Añadir al carrito
      </button>

    </div>
  `;
}


function renderCart() {
  const container =
    document.getElementById("cartItems");

  const totalContainer =
    document.getElementById("cartTotal");


  if (!container) return;


  const cart = getCart();


  if (cart.length === 0) {

    container.innerHTML =
      "<p>Tu carrito está vacío.</p>";

    totalContainer.innerHTML = "";

    return;
  }


  let total = 0;


  container.innerHTML = cart.map(item => {

    const product = products.find(
      p => p.id === item.id
    );

    const subtotal =
      product.price * item.quantity;

    total += subtotal;


    return `
      <div class="card">

        <h3>${product.name}</h3>

        <p>
          Cantidad: ${item.quantity}
        </p>

        <p>
          Subtotal: $${subtotal.toFixed(2)}
        </p>

        <button
          onclick="removeFromCart('${product.id}')"
        >
          Eliminar
        </button>

      </div>
    `;

  }).join("");


  totalContainer.innerHTML =
    "Total: $" + total.toFixed(2);
}


function setupCheckout() {
  const form =
    document.getElementById("checkoutForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();

      localStorage.removeItem("cart");

      window.location.href =
        "thank-you.html";
    }
  );
}


function setupNewsletter() {
  const form =
    document.getElementById("newsletterForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();

      alert("Gracias por suscribirte");

      form.reset();
    }
  );
}


function setupSearch() {
  const searchInput =
    document.getElementById("searchInput");

  const grid =
    document.getElementById("productsGrid");


  if (!searchInput || !grid) return;


  searchInput.addEventListener(
    "input",
    function() {

      const query =
        searchInput.value.toLowerCase();


      const results = products.filter(
        product =>

          product.name
            .toLowerCase()
            .includes(query)

          ||

          product.category
            .toLowerCase()
            .includes(query)
      );


      grid.innerHTML = results.map(product => `
        <div class="card">

          <img
            src="${product.image}"
            alt="${product.name}"
          >

          <h3>${product.name}</h3>

          <p>${product.category}</p>

          <p>$${product.price}</p>

          <a
            class="btn"
            href="product.html?id=${product.id}"
          >
            Ver detalle
          </a>

          <button onclick="addToCart('${product.id}')">
            Añadir al carrito
          </button>

        </div>
      `).join("");
    }
  );
}


renderProducts();
renderProductDetail();
renderCart();
setupCheckout();
setupNewsletter();
setupSearch();
