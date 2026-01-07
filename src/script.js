import { Timeline } from './timeline.js';

// Load data from multiple JSON files
async function loadAllData() {
    try {
        // 1. Read the index to know which files to load
        const indexResponse = await fetch('data/index.json');
        if (!indexResponse.ok) {
            throw new Error(`Failed to load index.json: ${indexResponse.statusText}`);
        }
        const index = await indexResponse.json();

        // 2. Load each file in parallel
        const filePromises = index.files.map(file =>
            fetch(`data/${file}`).then(res => res.json())
        );

        const fileContents = await Promise.all(filePromises);

        // 3. Merge all items into a single array
        const allItems = fileContents.reduce((acc, items) => acc.concat(items), []);

        console.log(`Loaded ${allItems.length} items from ${index.files.length} files.`);
        return allItems;
    } catch (err) {
        console.error('Failed to load timeline data:', err);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const items = await loadAllData();
    
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