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


const addButton = document.getElementById('addButton');
const entryNameInput = document.getElementById('entryName');
const entryLinkInput = document.getElementById('entryLink');
const entriesList = document.getElementById('entriesList');

// Function to render the entries list
function renderEntries(entries) {
  entriesList.innerHTML = ''; // Clear the list first
  if (entries && entries.length > 0) {
    entries.forEach((entry) => {
      if (entry.role == "title") {
        const li = document.createElement('li');
        li.innerHTML = `
          <span><a href="${entry.link}" target="_blank">${entry.name}</a></span>
          <button class="remove" data-group="${entry.group}">Remove</button>
        `;
        entriesList.appendChild(li);
      }

    });
  } else {
    entriesList.innerHTML = '<li>No entries yet</li>';
  }
}

// Function to add a new entry
function addEntry(name, link, group, role) {
  chrome.storage.local.get(['entries'], function(result) {
    let entries = result.entries || [];
    entries.push({ name, link, group, role, id: uuidv4()});

    chrome.storage.local.set({ entries }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving data to storage:', chrome.runtime.lastError);
      } else {
        renderEntries(entries); // Re-render the entries after adding
      }
    });
  });
}

// Function to remove an entry by index
function removeEntry(group) {
  chrome.storage.local.get(['entries'], function(result) {
    let entries = result.entries || [];

    for (let index = entries.length - 1; index >= 0; index--) {
      if (entries[index].group == group) {
        entries.splice(index, 1)
      }
    }

    chrome.storage.local.set({ entries }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving data to storage:', chrome.runtime.lastError);
      } else {
        renderEntries(entries); // Re-render the entries after removal
      }
    });
  });
}

// Add event listener for the "Add" button
addButton.addEventListener('click', function() {
  const name = entryNameInput.value.trim();
  const link = entryLinkInput.value.trim();
  
  if (name && link) {
    addEntry(name, link, uuidv4(), "title");
    entryNameInput.value = ''; 
    entryLinkInput.value = '';
  } else {
    alert('Please enter both a name and a link.');
  }
});

// Add event listener for removing an entry
entriesList.addEventListener('click', function(event) {
  if (event.target.classList.contains('remove')) {
    const group = event.target.dataset.group;
    removeEntry(group); // Remove entry at the clicked index
  }
});

// Load and render saved entries when the popup is opened
chrome.storage.local.get(['entries'], function(result) {
  let entries = result.entries || [];
  
  // If entries are empty, initialize with default values
  if (entries.length === 0) {
    entries = defaultEntries;
    chrome.storage.local.set({ entries }); // Save default entries to storage
  }

  renderEntries(entries); // Load and render entries
});
