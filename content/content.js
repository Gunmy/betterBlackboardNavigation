console.log('Content script loaded!');

const defaultEntries = [
  { name: "🚀 Start", link: "https://ntnu.blackboard.com/ultra/institution-page" },
  { name: "👤 Profile", link: "https://ntnu.blackboard.com/ultra/profile" },
  { name: "📋 Activity", link: "https://ntnu.blackboard.com/ultra/stream" },
  { name: "📅 Calendar", link: "https://ntnu.blackboard.com/ultra/calendar"},
  { name: "✉️ Messages", link: "https://ntnu.blackboard.com/ultra/messages"},
  { name: "🏆 Grades", link: "https://ntnu.blackboard.com/ultra/grades"},
  { name: "📚 Courses", link: "https://ntnu.blackboard.com/ultra/course" },
  { name: "↩ Log out", link: "https://ntnu.blackboard.com/ultra/logout"}
];


// Load and render saved entries when the popup is opened
chrome.storage.local.get(['entries'], function(result) {
  let entries = result.entries || [];
  
  // If entries are empty, initialize with default values
  if (entries.length === 0) {
    entries = defaultEntries;
    chrome.storage.local.set({ entries }); // Save default entries to storage
  }
});


function normalizeUrl(url) {
  try {
    const normalizedUrl = new URL(url.startsWith('http') ? url : 'https://' + url);
    return normalizedUrl.origin + normalizedUrl.pathname + normalizedUrl.search;
  } catch (e) {
    return null; // If the URL is invalid, return null
  }
}

function getCourseIdFromLink(url) {
  const urlParams = new URL(url).searchParams;
  return urlParams.get('course_id');
}

function sameId(url1, url2) {
  return getCourseIdFromLink(url1) === getCourseIdFromLink(url2) && getCourseIdFromLink(url1) != null && getCourseIdFromLink(url2) != null;
}

function areUrlsEqual(url1, url2) {
  return normalizeUrl(url1) === normalizeUrl(url2);
}

// Function to apply layout classes to the left menu and off-canvas panel
function applyLayout(entries) {

  const main = document.querySelector('main') || document.body;


    let existingMenu = main.querySelector('.left-menu');
    if (!existingMenu) {
      let menu = document.createElement('div');
      menu.classList.add('left-menu');

      // Create the inner div
      let innerDiv = document.createElement('div');

      // Create the h1 element
      let title = document.createElement('h1');
      title.textContent = 'Links'; // Set the text for the title

      title.classList.add('title');
      innerDiv.classList.add('title_div');

      // Append the h1 to the inner div
      innerDiv.appendChild(title);

      // Append the inner div to the menu
      menu.appendChild(innerDiv);

      if (Array.isArray(entries) && entries.length > 0) {
        entries.forEach(({ name, link }) => {
          const button = document.createElement('button');
          button.textContent = name;
          button.classList.add('styled-button'); // Add class for styling
      
          if (areUrlsEqual(window.location.href, link) || sameId(window.location.href, link)) {
            button.classList.add('current-page'); // Add class for styling

          }

          button.addEventListener('click', () => {
            window.location.href = link;
          });
      
          menu.appendChild(button);
        });
      } else {
        console.error('Data is not in the expected format or is empty', entries);
      }

      main.appendChild(menu);

    const offCanvasPanel = document.querySelector('.bb-offcanvas-panel');

    if (offCanvasPanel) {
      offCanvasPanel.classList.add('offcanvas-panel');
    }
  }
}

// Function to remove .bb-offcanvas-overlay elements from the DOM
function removeOffcanvasOverlay() {
  const overlay = document.querySelector('.bb-offcanvas-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function removeClose() {
  const closeButton = document.querySelector('.bb-close');
  if (closeButton) {
    closeButton.remove();
  }
}


function addEntry(name, link) {
  chrome.storage.local.get(['entries'], function(result) {
    let entries = result.entries || [];
    entries.push({ name, link });

    chrome.storage.local.set({ entries }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving data to storage:', chrome.runtime.lastError);
      } else {
        renderEntries(entries); // Re-render the entries after adding
      }
    });
  });
}

function makeName(arr) {

  let book = ["📘","📙","📕"][Math.floor(Math.random() * 3)]


  let name = book + arr[0]
  let words = arr.slice(1, arr.length - 2)

  let sortedWords = [...words].sort((a, b) => b.length - a.length).slice(0, 3)
  
  const filteredWords = sortedWords.slice(0, 5).some(word => word.length > 2)
    ? sortedWords.filter(word => word.length > 2)  // Keep only words over 5 letters
    : [sortedWords[0]];


    if (filteredWords.length > 1) {
      words.forEach(word => {
        if (filteredWords.includes(word)) {
          if (word.length <= 8) {
            name += " " + word
          } else {
            name += " " + word.substring(0, 6);
    
          }
        }
      
      });
    } else {
      if (words[0].length <= 15) {
        name += " " + words[0]
      } else {
        name += " " + words[0].substring(0, 10);
      }
    }


  return name;
}

function addButtonToArticle(article, entries) {
  // Check if the article already has a button
  if (article.querySelector('.course-id-button')) return;

  // Create a button
  const button = document.createElement('button');
  button.textContent = 'Add to list';

  // Apply the CSS class for styling
  button.classList.add('course-id-button');

  // Append the button to the article
  article.appendChild(button);

  // Add an event listener to the button to log the ID when clicked
  button.addEventListener('click', () => {
    const courseId = article.getAttribute('data-course-id');
    const courseTitleElement = article.querySelector('h4.js-course-title-element').textContent.trim().split(/\s+/);

    addEntry(makeName(courseTitleElement), "https://ntnu.blackboard.com/webapps/blackboard/execute/courseMain?course_id=" + courseId);

    window.location.reload();

  });
}

function handlePageTitleHeader(h1, entries) {
  console.log("Found h1")

  if (h1.querySelector('.title-button')) return;

  console.log("Found h1")


  const titleTextSpan = h1.querySelector('#pageTitleText');
  if (titleTextSpan) {

    const button = document.createElement('button');
    button.textContent = 'Add to list';

    const pageTitle = titleTextSpan.textContent.trim();
    if (pageTitle == "Course front page") {
      return;
    }
  
    // Apply the CSS class for styling
    button.classList.add('title-button');
  
    // Append the button to the article
    h1.appendChild(button);
  
    // Add an event listener to the button to log the ID when clicked
    button.addEventListener('click', () => {
      addEntry(pageTitle, window.location.href);
      window.location.reload();
  
    });
  }


}


// Mutation observer callback for removing overlays dynamically
function doChanges(mutationsList) {
  removeOffcanvasOverlay(); // Remove overlays whenever the DOM changes
  removeClose();

  chrome.storage.local.get(['entries'], function(result) {
    const entries = result.entries && result.entries.length > 0 ? result.entries : defaultEntries;

    let existingMenu = document.querySelector('.left-menu');

    if (!existingMenu) {
      applyLayout(entries);
    }

    mutationsList.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          // Check for article elements
          if (node.matches('article[data-course-id]')) {
            addButtonToArticle(node, entries);
          }
    
          // Check for the specific h1 element
          if (node.matches('h1#pageTitleHeader')) {
            handlePageTitleHeader(node, entries);
          }
        }
      });
    });
  });
}



// Initial setup: apply layout and remove existing overlays
function initialize() {
    // Observer for dynamically added bb-offcanvas-panel
    const observer = new MutationObserver(doChanges);
    observer.observe(document.body, { childList: true, subtree: true });

}

// Start the script
initialize();

document.querySelectorAll('article[data-course-id]').forEach(addButtonToArticle);
document.querySelectorAll('h1#pageTitleHeader').forEach(handlePageTitleHeader);
