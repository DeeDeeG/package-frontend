function changeThemeBtn() {
  document.getElementById("dropdown-list").classList.toggle("show");
}

function changeTheme(theme) {
  switch(theme) {
    case "github-dark":
      document.body.setAttribute("theme", "github-dark");
      localStorage.setItem("theme", "github-dark");
      break;
    case "original-theme":
    default:
      document.body.setAttribute("theme", "original-theme");
      localStorage.setItem("theme", "original-theme");
      break;
  }
}

function loadStats() {
  if (timetable) {
    console.log(timetable);
  } else {
    console.error("No stats found!");
  }
}

window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
      let openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

window.onload = function(event) {
  if (localStorage.getItem("theme")) {
    // If a theme has been set or saved.
    changeTheme(localStorage.getItem("theme"));
  }

  // Check to see if we are on the User Account Page
  if (window.location.href.indexOf("/users")) {
    // This should work locally in dev and on public, as long as the slug "users"
    // is never reused.
    // But now that we know we are on the user page, lets start requesting their user data
    userAccountActions();
  }
};

function userAccountActions() {
  // First lets see if they have a token in their request
  // This likely means a first time user or they are updating their user details
  const urlParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlParams.entries());

  let token = params.token;

  if (typeof token === undefined) {
    // The user expects to already be logged in. Do they have data saved locally?
    userAccountLocal();
  } else {
    // The user needs to access the API to retreive user details. Ignore any local data.
    userAccountAPI(token);
  }
}

function userAccountLocal() {
  if (localStorage.getItem("user")) {
    let user = localStorage.getItem("user");

    // Now we have a user matching the object available in userAccountAPI
    
  } else {
    // They haven't given us any query parameters, but don't have any local data either
    // Lets redirect to the sign in page.
    window.location.href = "https://web.pulsar-edit.dev/login";
  }
}

function userAccountAPI(token) {
  fetch("https://api.pulsar-edit.dev/api/packages/hey-pane", {
    headers: {
      "Authorization": token
    },
    mode: "no-cors"
  })
    .then((response) => response.json())
    .then((data) => {
      // Now we should have a data object matching the below.

      // data.username
      // data.avatar
      // data.created_at
      // data.data
      // data.node_id
      // data.token
      // data.packages
    });
}
