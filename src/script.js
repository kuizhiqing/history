import { Timeline } from './timeline.js';

// Get timeline parameter from URL or default to 'mathematics'
function getTimelineParam() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('timeline') || 'mathematics';
}

// Load data from a specific timeline JSON file
async function loadTimelineData(timelineName) {
    try {
        const response = await fetch(`data/${timelineName}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load ${timelineName}.json: ${response.statusText}`);
        }
        const items = await response.json();
        console.log(`Loaded ${items.length} items from ${timelineName}.json`);
        return items;
    } catch (err) {
        console.error(`Failed to load timeline data for '${timelineName}':`, err);
        // Fallback to mathematics if the requested timeline doesn't exist
        if (timelineName !== 'mathematics') {
            console.log('Falling back to mathematics timeline...');
            return loadTimelineData('mathematics');
        }
        return [];
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const timelineName = getTimelineParam();
    document.title = `${timelineName.charAt(0).toUpperCase() + timelineName.slice(1)} Timeline`;
    const items = await loadTimelineData(timelineName);
    
    // Modal elements
    const modal = document.querySelector('#details-modal');
    const modalTitle = document.querySelector('#modal-title');
    const modalBody = document.querySelector('#modal-body');
    const closeBtn = document.querySelector('.close-modal');

    // Define the click handler for timeline items
    const handleItemClick = (item, e) => {
        modalTitle.textContent = item.title;
        modalBody.innerHTML = `
            <p><strong>Type:</strong> ${item.type}</p>
            <p><strong>Start:</strong> ${item.start}</p>
            ${item.end ? `<p><strong>End:</strong> ${item.end}</p>` : ''}
            ${item.tags?.length ? `<p><strong>Tags:</strong> ${item.tags.join(', ')}</p>` : ''}
            ${item.description ? `<p>${item.description}</p>` : ''}
        `;
        
        // Show initially to measure dimensions
        modal.style.display = 'block';
        modal.classList.remove('hidden');
        
        // Position logic
        const modalContent = modal.querySelector('.modal-content');
        if (e && e.currentTarget) {
            const rect = e.currentTarget.getBoundingClientRect();
            const modalRect = modalContent.getBoundingClientRect();
            
            let top = rect.top - modalRect.height - 15; // 15px gap above
            let left = rect.left + (rect.width / 2) - (modalRect.width / 2); // Center horizontally

            // Boundary checks
            // 1. Top overflow: flip to bottom if not enough space above
            if (top < 10) {
                 top = rect.bottom + 15;
            }
            
            // 2. Horizontal overflow
            if (left < 10) left = 10;
            if (left + modalRect.width > window.innerWidth - 10) {
                left = window.innerWidth - modalRect.width - 10;
            }

            modalContent.style.top = `${top}px`;
            modalContent.style.left = `${left}px`;
        }
    };

    // Initialize Timeline with the correct container ID and click handler
    // Note: timeline.js expects the ID string, not the element.
    const timeline = new Timeline('timeline-container', items, handleItemClick);
    window.timeline = timeline; // For debugging

    // Zoom buttons - IDs match index.html (zoom-in, zoom-out)
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => timeline.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => timeline.zoomOut());

    // Filter checkboxes
    const filterContainer = document.querySelector('#filterContainer');
    if (filterContainer) {
        timeline.getUniqueTags().forEach(tag => {
            const id = `filter-${tag}`;
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = id;
            checkbox.checked = true;
            checkbox.addEventListener('change', () => timeline.toggleTag(tag, checkbox.checked));

            label.htmlFor = id;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${tag}`));
            filterContainer.appendChild(label);
        });
    }

    // Timeline selector dropdown
    const timelineSelect = document.getElementById('timeline-select');
    if (timelineSelect) {
        // Set the current value based on URL parameter
        timelineSelect.value = timelineName;

        // Handle timeline switching
        timelineSelect.addEventListener('change', (e) => {
            const newTimeline = e.target.value;
            const url = new URL(window.location);
            url.searchParams.set('timeline', newTimeline);
            window.location.href = url.toString();
        });
    }

    // Modal Close Logic
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        });
    }

    window.addEventListener('click', e => {
        if (e.target === modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    });
});