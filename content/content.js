console.log("Rendering content!")

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
      // Create the menu
      let menu = document.createElement('ul');
      menu.classList.add('left-menu');

      // Create the links

      const groups = {}

      console.log(entries);
      if (Array.isArray(entries) && entries.length > 0) {
        entries.forEach(({ name, link, group, role }) => {

          if (!(group in groups)) {
            groups[group] = {}

            groups[group].outer = document.createElement('li');
            groups[group].inner = document.createElement('ul');
            
            groups[group].outer.appendChild(groups[group].inner)
            menu.appendChild(groups[group].outer);

            
            if (areUrlsEqual(link, window.location.href) || sameId(link, window.location.href)) {
              groups[group].outer.classList.add("current-page");
            }
          }

          if (role == "title") {
            const title = document.createElement('h1');
            const a = document.createElement('a');
            const p = document.createElement('p')

            p.textContent = name;
            a.href = link;

            if (areUrlsEqual(link, window.location.href) || (window.location.href.startsWith("https://ntnu.blackboard.com/webapps/blackboard/execute/modulepage/view") && sameId(link, window.location.href))) {
              title.classList.add("current-subpage");
            }

            a.appendChild(p);
            title.appendChild(a);

            groups[group].outer.prepend(title);
          } else if (role == "sublink") {
            const li = document.createElement('li');
            const a = document.createElement('a');
            const p = document.createElement('p')


            p.textContent = " ▪ " + name;
            a.href = link;

            if (areUrlsEqual(link, window.location.href)) {
              a.classList.add("current-subpage");
            }

            a.appendChild(p);
            li.appendChild(a);

            groups[group].inner.appendChild(li);
          }
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


function addEntry(name, link, group, role) {
  chrome.storage.local.get(['entries'], function(result) {
    let entries = result.entries || [];
    entries.push({ name, link, group, role });

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


  let name = book + arr.slice(0, arr.length - 2).join(" ");

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

    addEntry(makeName(courseTitleElement), "https://ntnu.blackboard.com/webapps/blackboard/execute/courseMain?course_id=" + courseId, courseId, "title");

    window.location.reload();

  });
}

function handlePageTitleHeader(h1, entries) {

  if (h1.querySelector('.title-button') || window.location.href.includes("modulepage")) return;

  const titleTextSpan = h1.querySelector('#pageTitleText');
  if (titleTextSpan) {

    const button = document.createElement('button');
    button.textContent = 'Add to list';

    const pageTitle = titleTextSpan.textContent.trim();
  
    // Apply the CSS class for styling
    button.classList.add('title-button');
  
    // Append the button to the article
    h1.appendChild(button);
  
    // Add an event listener to the button to log the ID when clicked
    button.addEventListener('click', () => {
      addEntry(pageTitle, window.location.href, getCourseIdFromLink(window.location.href), "sublink");
      window.location.reload();
  
    });
  }


}

let lastURL = window.location.href;

// Mutation observer callback for removing overlays dynamically
function doChanges(mutationsList) {
  removeOffcanvasOverlay(); // Remove overlays whenever the DOM changes
  removeClose();

  const currentURL = window.location.href;
  if (currentURL !== lastURL) {

    let existingMenu = document.querySelector('.left-menu');
    existingMenu.remove();

    lastURL = currentURL; // Update the last known URL
  }

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