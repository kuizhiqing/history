import { Timeline } from './timeline.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
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
                // Fallback: try to load the old single file
                console.log('Falling back to data.json...');
                const fallback = await fetch('data/data.json');
                return fallback.json();
            }
        }

        const data = await loadAllData();
        
        // Modal Logic
        const modal = document.getElementById('details-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const closeModal = document.querySelector('.close-modal');

        const openModal = (item) => {
            modalTitle.textContent = item.title;
            modalBody.innerHTML = `
                <div class="modal-row"><span class="modal-label">Type:</span> ${item.type}</div>
                <div class="modal-row"><span class="modal-label">Start:</span> ${item.start}</div>
                ${item.end ? `<div class="modal-row"><span class="modal-label">End:</span> ${item.end}</div>` : ''}
                <div class="modal-row"><span class="modal-label">Tags:</span> ${item.tags.join(', ')}</div>
                <div class="modal-row"><span class="modal-label">ID:</span> ${item.id}</div>
            `;
            modal.classList.remove('hidden');
        };

        closeModal.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        // Close on outside click
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });

        const timeline = new Timeline('timeline-container', data, openModal);

        // Setup Controls
        const btnZoomIn = document.getElementById('zoom-in');
        const btnZoomOut = document.getElementById('zoom-out');
        
        btnZoomIn.addEventListener('click', () => {
            timeline.zoomIn();
        });

        btnZoomOut.addEventListener('click', () => {
            timeline.zoomOut();
        });

        // Setup Filters
        const filterContainer = document.getElementById('filter-container');
        timeline.tags.forEach(tag => {
            const label = document.createElement('label');
            label.className = 'filter-label';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true; // Default all visible
            checkbox.value = tag;

            checkbox.addEventListener('change', (e) => {
                timeline.toggleTag(tag, e.target.checked);
            });

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(tag));
            filterContainer.appendChild(label);
        });

    } catch (err) {
        console.error("Failed to load timeline data:", err);
    }
});