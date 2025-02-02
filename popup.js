console.log("Rendering popup!")

const defaultEntries = [
  { name: "Blackboard", link: "https://ntnu.blackboard.com", group: "blackboard", role: "title"},
  { name: "🚀 Start", link: "https://ntnu.blackboard.com/ultra/institution-page", group: "start", role: "title"},
  { name: "👤 Profile", link: "https://ntnu.blackboard.com/ultra/profile", group: "profile", role: "title"},
  { name: "📋 Activity", link: "https://ntnu.blackboard.com/ultra/stream", group: "activity", role: "title"},
  { name: "📅 Calendar", link: "https://ntnu.blackboard.com/ultra/calendar", group: "calendar", role: "title"},
  { name: "✉️ Messages", link: "https://ntnu.blackboard.com/ultra/messages", group: "messages", role: "title"},
  { name: "🏆 Grades", link: "https://ntnu.blackboard.com/ultra/grades", group: "grades", role: "title"},
  { name: "📚 Courses", link: "https://ntnu.blackboard.com/ultra/course", group: "courses", role: "title"},
  { name: "↩ Log out", link: "https://ntnu.blackboard.com/ultra/logout", group: "logout", role: "title"}
];


const addButton = document.getElementById('addButton');
const entryNameInput = document.getElementById('entryName');
const entryLinkInput = document.getElementById('entryLink');
const entriesList = document.getElementById('entriesList');

// Function to render the entries list
function renderEntries(entries) {
  entriesList.innerHTML = ''; // Clear the list first
  if (entries && entries.length > 0) {
    entries.forEach((entry, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span><a href="${entry.link}" target="_blank">${entry.name}</a></span>
        <button class="remove" data-index="${index}">Remove</button>
      `;
      entriesList.appendChild(li);
    });
  } else {
    entriesList.innerHTML = '<li>No entries yet</li>';
  }
}

// Function to add a new entry
function addEntry(name, link) {
  chrome.storage.local.get(['entries'], function(result) {
    let entries = result.entries || [];
    entries.push({ name, link, group: "added"});

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
function removeEntry(index) {
  chrome.storage.local.get(['entries'], function(result) {
    let entries = result.entries || [];
    entries.splice(index, 1); // Remove the entry from the array

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
    addEntry(name, link); // Add entry if both fields are filled
    entryNameInput.value = ''; // Clear input fields after adding
    entryLinkInput.value = '';
  } else {
    alert('Please enter both a name and a link.');
  }
});

// Add event listener for removing an entry
entriesList.addEventListener('click', function(event) {
  if (event.target.classList.contains('remove')) {
    const index = event.target.dataset.index;
    removeEntry(parseInt(index, 10)); // Remove entry at the clicked index
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
