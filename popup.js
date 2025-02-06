console.log("Rendering popup!")

const defaultEntries = [
  { name: "Blackboard", link: "https://ntnu.blackboard.com", group: "blackboard", role: "title", id: "a"},
  { name: "🚀 Start", link: "https://ntnu.blackboard.com/ultra/institution-page", group: "start", role: "title", id: "b"},
  { name: "👤 Profile", link: "https://ntnu.blackboard.com/ultra/profile", group: "profile", role: "title", id: "c"},
  { name: "📋 Activity", link: "https://ntnu.blackboard.com/ultra/stream", group: "activity", role: "title", id: "d"},
  { name: "📅 Calendar", link: "https://ntnu.blackboard.com/ultra/calendar", group: "calendar", role: "title", id: "e"},
  { name: "✉️ Messages", link: "https://ntnu.blackboard.com/ultra/messages", group: "messages", role: "title", id: "f"},
  { name: "🏆 Grades", link: "https://ntnu.blackboard.com/ultra/grades", group: "grades", role: "title", id: "g"},
  { name: "📚 Courses", link: "https://ntnu.blackboard.com/ultra/course", group: "courses", role: "title", id: "h"},
  { name: "↩ Log out", link: "https://ntnu.blackboard.com/ultra/logout", group: "logout", role: "title", id: "i"}
];


function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  );
}

const addButton = document.getElementById("addButton");
const entryNameInput = document.getElementById("entryName");
const entryLinkInput = document.getElementById("entryLink");
const entriesList = document.getElementById("entriesList");
const homePage = document.getElementById("homePage");
const detailsPage = document.getElementById("detailsPage");
const detailsTitle = document.getElementById("detailsTitle");
const detailsLinks = document.getElementById("detailsLinks");
const backButton = document.getElementById("backButton");

let currentGroup = null;

// Function to show home or details page
function showPage(page) {
  homePage.style.display = page === "home" ? "block" : "none";
  detailsPage.style.display = page === "details" ? "block" : "none";
}



// Function to render the entries list
function renderEntries(entries) {
  entriesList.innerHTML = "";
  if (entries.length > 0) {
    entries.forEach(entry => {
      if (entry.role === "title") {
        const li = document.createElement("li");

        const linkDiv = document.createElement("div");
        const link = document.createElement("a");
        link.href = entry.link;
        link.target = "_blank";
        link.innerHTML = `<p>${entry.name}</p>`;
        linkDiv.appendChild(link);

        const viewButton = document.createElement("button");
        viewButton.classList.add("view");
        viewButton.dataset.group = entry.group;
        viewButton.innerHTML = "<p>View</p>";
        viewButton.onclick = () => showDetails(entry.group, entries);

        const removeButton = document.createElement("button");
        removeButton.classList.add("remove");
        removeButton.dataset.group = entry.group;
        removeButton.innerHTML = "<p>Remove</p>";
        removeButton.onclick = () => renderEntries(removeEntry(entries, entry.group, null));

        li.appendChild(linkDiv);
        li.appendChild(viewButton);
        li.appendChild(removeButton);
        entriesList.appendChild(li);
      }
    });
  } else {
    entriesList.innerHTML = "<li>No entries yet</li>";
  }
}


// Function to add a new entry
function addEntry(name, link, group, role) {
  chrome.storage.local.get(["entries"], function (result) {
    let entries = result.entries || [];
    entries.push({ name, link, group, role, id: uuidv4() });

    chrome.storage.local.set({ entries }, function () {
      if (chrome.runtime.lastError) {
        console.error("Error saving data to storage:", chrome.runtime.lastError);
      } else {
        renderEntries(entries);
        if (currentGroup) {
          showDetails(currentGroup, entries);
        }
      }
    });
  });
}

// Function to remove an entry
function removeEntry(entries, group, link) {

  for (let index = entries.length - 1; index >= 0; index--) {
    if (group && entries[index].group == group) {
      entries.splice(index, 1)
    } else if (link && entries[index].link == link) {
      entries.splice(index, 1)
    }
  }

  chrome.storage.local.set({ entries }, function () {
  });

  return entries;

}

// Function to show details of a group
function showDetails(group, entries) {

  currentGroup = group;

  let groupEntries = entries.filter(entry => entry.group === group && entry.role !== "title");
  let groupHeader = entries.filter(entry => entry.group === group && entry.role === "title")[0];

  detailsTitle.innerText = groupHeader.name;
  detailsLinks.innerHTML = "";

  if (groupEntries.length > 0) {
    groupEntries.forEach(entry => {
      const li = document.createElement("li");
      li.classList.add("sublist-li");



      const linkDiv = document.createElement("div");

      const link = document.createElement("a");
      link.href = entry.link;
      link.target = "_blank";
      link.innerHTML = `<p>${entry.name}</p>`;
      linkDiv.appendChild(link);

      const removeButton = document.createElement("button");
      removeButton.classList.add("remove");
      removeButton.dataset.group = entry.group;
      removeButton.innerHTML = "<p>Remove</p>";
      removeButton.onclick = () => showDetails(group, removeEntry(entries, null, entry.link));
      
      li.appendChild(linkDiv);
      li.appendChild(removeButton);
      detailsLinks.appendChild(li);
    });
  } else {
    detailsLinks.innerHTML = "<li>No sublinks in this group!</li>";
  }

  showPage("details");
}

// Add event listener for the "Add" button
addButton.addEventListener("click", function () {
  const name = entryNameInput.value.trim();
  const link = entryLinkInput.value.trim();

  if (name && link) {

    if (currentGroup) {
      addEntry(name, link, currentGroup, "sublink");
    } else {
      addEntry(name, link, uuidv4(), "title");

    }

    entryNameInput.value = "";
    entryLinkInput.value = "";
  } else {
    alert("Please enter both a name and a link.");
  }
});


// Back button event
backButton.addEventListener("click", function () {
  currentGroup = null;
  showPage("home");
});

// Load saved entries
chrome.storage.local.get(["entries"], function (result) {
  let entries = result.entries || [];

  if (entries.length === 0) {
    entries = defaultEntries;
    chrome.storage.local.set({ entries });
  }

  renderEntries(entries);
  showPage("home"); // Ensure we start at home page
});