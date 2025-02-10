console.log("Rendering content!")

const defaultEntries = [
  { name: "Blackboard", link: "https://ntnu.blackboard.com", group: "blackboard", role: "title", id: "a", type: "internal"},
  { name: "🚀 Start", link: "https://ntnu.blackboard.com/ultra/institution-page", group: "start", role: "title", id: "b", type: "internal"},
  { name: "👤 Profile", link: "https://ntnu.blackboard.com/ultra/profile", group: "profile", role: "title", id: "c", type: "internal"},
  { name: "📋 Activity", link: "https://ntnu.blackboard.com/ultra/stream", group: "activity", role: "title", id: "d", type: "internal"},
  { name: "📅 Calendar", link: "https://ntnu.blackboard.com/ultra/calendar", group: "calendar", role: "title", id: "e", type: "internal"},
  { name: "✉️ Messages", link: "https://ntnu.blackboard.com/ultra/messages", group: "messages", role: "title", id: "f", type: "internal"},
  { name: "🏆 Grades", link: "https://ntnu.blackboard.com/ultra/grades", group: "grades", role: "title", id: "g", type: "internal"},
  { name: "📚 Courses", link: "https://ntnu.blackboard.com/ultra/course", group: "courses", role: "title", id: "h", type: "internal"},
  { name: "↩ Log out", link: "https://ntnu.blackboard.com/ultra/logout", group: "logout", role: "title", id: "i", type: "internal"}
];

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  );
}

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


function renderEntries(entries, menu) {
  // Create the links

  menu.innerHTML = "";

  const groups = {}

  if (Array.isArray(entries) && entries.length > 0) {
    entries.forEach(({ name, link, group, role, type }) => {

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

      const a = document.createElement('a');

      if (type == "external") {
        a.href = "https://ntnu.blackboard.com/webapps/blackboard/execute/modulepage/view#" + link;
      } else {
        a.href = link;
      }

      if (role == "title") {
        const title = document.createElement('h1');
        const p = document.createElement('p')

        p.textContent = name;

        if (areUrlsEqual(link, window.location.href) || (window.location.href.startsWith("https://ntnu.blackboard.com/webapps/blackboard/execute/modulepage/view") && sameId(link, window.location.href))) {
          title.classList.add("current-subpage");
        }

        a.appendChild(p);
        title.appendChild(a);

        groups[group].outer.prepend(title);
      } else if (role == "sublink") {
        const li = document.createElement('li');
        const p = document.createElement('p')


        p.textContent = " ▪ " + name;

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
}

function fetchBlackboardRedirect(url) {
      const prefix = "https://ntnu.blackboard.com/webapps/blackboard/execute/modulepage/view#"
      
      if (url.startsWith(prefix)) {
          const decodedUrl = decodeURIComponent(url.slice(prefix.length));
          console.log(url, decodedUrl);
          return decodedUrl;
      } else {
        return null;
      }
};


// Function to apply layout classes to the left menu and off-canvas panel
function applyLayout(entries) {

  const main = document.querySelector('main') || document.body;


    let existingMenu = main.querySelector('.left-menu');
    if (!existingMenu) {

      let externalLink = fetchBlackboardRedirect(window.location.href);

      if (externalLink != null) {
        console.log(externalLink);
        main.innerHTML = "";
        const iframe = document.createElement("iframe");
        iframe.src = externalLink;
        iframe.classList.add("inserted-iframe");

        main.appendChild(iframe);
      }

      // Create the menu
      let menu = document.createElement('ul');
      menu.classList.add('left-menu');
      
      renderEntries(entries, menu);

      main.prepend(menu);


  

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
    entries.push({ name, link, group, role, id: uuidv4(), type: "internal"});

    chrome.storage.local.set({ entries }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving data to storage:', chrome.runtime.lastError);
      } else {
        let menu = document.querySelector('.left-menu');
        renderEntries(entries, menu); // Re-render the entries after adding
      }
    });
  });
}

// Function to remove an entry by index
function removeEntry(group, link) {
  chrome.storage.local.get(['entries'], function(result) {
    let entries = result.entries || [];

    for (let index = entries.length - 1; index >= 0; index--) {
      if (group && entries[index].group == group) {
        entries.splice(index, 1)
      } else if (link && entries[index].link == link) {
        entries.splice(index, 1)

      }
    }

    chrome.storage.local.set({ entries }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving data to storage:', chrome.runtime.lastError);
      } else {
        let menu = document.querySelector('.left-menu');
        renderEntries(entries, menu); // Re-render the entries after removal
      }
    });
  });
}

function makeName(arr) {

  let book = ["📘","📙","📕","📗"][Math.floor(Math.random() * 4)]


  let name = book + arr.slice(0, arr.length - 2).join(" ");

  return name;
}

function waitForAttribute(element, attribute, callback) {
  const observer = new MutationObserver(() => {
    const value = element.getAttribute(attribute);
    if (value) {
      observer.disconnect();
      callback(value);
    }
  });

  observer.observe(element, { attributes: true, attributeFilter: [attribute] });
}

function addButtonToArticle(article, entries) {
  // Check if the article already has a button
  if (article.querySelector('.course-id-button')) return;

  waitForAttribute(article, 'data-course-id', (courseId) => {
  // Create a button
    const button = document.createElement('button');
    // Apply the CSS class for styling
    button.classList.add('course-id-button');

    // Append the button to the article
    article.appendChild(button);

    button.textContent = 'Add shortcut';

    for (let i = 0; i < entries.length; i++) {
      if (courseId && courseId == entries[i].group) {

        button.classList.add('red-button');
        button.textContent = 'Remove shortcut';

      }
    }


    button.addEventListener('click', () => {

      if (button.classList.contains('red-button')) {
        button.classList.remove('red-button');
        button.textContent = 'Add shortcut';

        removeEntry(courseId, null);
      } else {

        button.classList.add('red-button');
        button.textContent = 'Remove shortcut';

        const courseTitleElement = article.querySelector('h4.js-course-title-element').textContent.trim().split(/\s+/);

        addEntry(makeName(courseTitleElement), "https://ntnu.blackboard.com/webapps/blackboard/execute/courseMain?course_id=" + courseId, courseId, "title");
      }
    });



  });


}

function addButtonToCrumb(div, entries) {

  if (div.querySelector('.title-button') || window.location.href.includes("modulepage")) return;


  const crumbs = div.querySelectorAll("span[id^='crumb_']");
  const ol = div.querySelector("ol");

  let maxCrumb = null;
  let maxNumber = -1;

  crumbs.forEach(crumb => {
      const match = crumb.id.match(/\d+/);
      if (match) {
          const number = parseInt(match[0], 10);
          if (number > maxNumber) {
              maxNumber = number;
              maxCrumb = crumb;
          }
      }
  });

  if (maxCrumb && ol) {
      const pageTitle = maxCrumb.textContent.trim();
      
      const li = document.createElement('li');
      const button = document.createElement('button');

      li.appendChild(button);
      ol.appendChild(li);

      button.textContent = 'Add shortcut';
    
      // Apply the CSS class for styling
      button.classList.add('title-button');
    
      for (let i = 0; i < entries.length; i++) {
        if (window.location.href == entries[i].link) {
          
          button.classList.add('red-button');
          button.textContent = 'Remove shortcut';
  
        }
      }

      // Add an event listener to the button to log the ID when clicked
      button.addEventListener('click', () => {    
        if (button.classList.contains('red-button')) {
          button.classList.remove('red-button');
          button.textContent = 'Add shortcut';
  
          removeEntry(null, window.location.href);
        } else {
  
          button.classList.add('red-button');
          button.textContent = 'Remove shortcut';
    
          addEntry(pageTitle, window.location.href, getCourseIdFromLink(window.location.href), "sublink");
        }


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

    if (existingMenu) {
      existingMenu.remove();

    }

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
    
          // Breadcrumbs
          if (node.matches(".path")) {
            addButtonToCrumb(node, entries);
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


chrome.storage.local.get(['entries'], function(result) {
  document.querySelectorAll('article[data-course-id]').forEach(node => addButtonToArticle(node, result.entries));
  document.querySelectorAll(".path").forEach(node => addButtonToCrumb(node, result.entries));
});