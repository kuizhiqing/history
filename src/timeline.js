export class Timeline {
    constructor(containerId, data, onEventClick) {
        this.container = document.getElementById(containerId);
        this.content = this.container.querySelector('.timeline-content');
        this.data = this.parseData(data);
        this.onEventClick = onEventClick || (() => {});
        
        // Extended Palette with more variety (Material Design & standard vibrant sets)
        this.colors = [
            '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', 
            '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', 
            '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', 
            '#FF5722', '#795548', '#607D8B', '#D32F2F', '#C2185B',
            '#7B1FA2', '#512DA8', '#303F9F', '#1976D2', '#0288D1',
            '#0097A7', '#00796B', '#388E3C', '#689F38', '#AFB42B',
            '#FBC02D', '#FFA000', '#F57C00', '#E64A19', '#5D4037',
            '#455A64', '#EF5350', '#EC407A', '#AB47BC', '#7E57C2',
            '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A',
            '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28',
            '#FFA726', '#FF7043', '#8D6E63', '#78909C'
        ];
        this.tagColors = {};

        this.minDate = this.getMinDate();
        this.maxDate = this.getMaxDate();
        // Add padding
        this.minDate.setDate(this.minDate.getDate() - 365); // Add a year buffer
        this.maxDate.setDate(this.maxDate.getDate() + 365);

        // Auto-calculate initial zoom to fit screen (roughly)
        const totalDays = (this.maxDate - this.minDate) / (1000 * 60 * 60 * 24);
        const containerWidth = this.container.clientWidth || 1200;
        let initialZoom = containerWidth / totalDays;
        
        // Clamp initial zoom
        this.minZoom = 0.01; 
        this.maxZoom = 200;
        this.zoomLevel = Math.max(this.minZoom, initialZoom);

        this.tags = this.extractTags();
        this.assignColors(); 
        this.activeTags = new Set(this.tags);

        this.render();
        this.setupDragScroll();
    }

    _hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    assignColors() {
        this.tags.forEach(tag => {
            const hash = Math.abs(this._hashString(tag));
            this.tagColors[tag] = this.colors[hash % this.colors.length];
        });
    }

    getItemColor(item) {
        // Generate a hash based on the item's unique ID or Title to ensure
        // the color is random per-item but stable across renders.
        const uniqueKey = item.id ? item.id.toString() : (item.title + item.start);
        const hash = Math.abs(this._hashString(uniqueKey));
        return this.colors[hash % this.colors.length];
    }

    parseData(data) {
        return data.map(item => {
            return {
                ...item,
                startDate: new Date(item.start),
                endDate: item.end ? new Date(item.end) : null
            };
        }).sort((a, b) => a.startDate - b.startDate);
    }

    extractTags() {
        const tags = new Set();
        this.data.forEach(item => {
            if (item.tags) {
                item.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags);
    }

    getMinDate() {
        if (this.data.length === 0) return new Date();
        return new Date(Math.min(...this.data.map(d => d.startDate)));
    }

    getMaxDate() {
        if (this.data.length === 0) return new Date();
        return new Date(Math.max(...this.data.map(d => d.endDate || d.startDate)));
    }

    dateToPixel(date) {
        const diffTime = date - this.minDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays * this.zoomLevel;
    }

    setZoom(level) {
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, level));
    }

    zoomIn() {
        const targetZoom = this.zoomLevel * 1.2;
        this.animateZoom(targetZoom);
    }

    zoomOut() {
        const targetZoom = this.zoomLevel / 1.2;
        this.animateZoom(targetZoom);
    }

    animateZoom(targetZoom) {
        const clampedTarget = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));
        const startZoom = this.zoomLevel;
        const delta = clampedTarget - startZoom;
        const duration = 300; // ms
        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const ease = 1 - Math.pow(1 - progress, 2);
            this.zoomLevel = startZoom + (delta * ease);
            this.render();

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }

    toggleTag(tag, isActive) {
        if (isActive) {
            this.activeTags.add(tag);
        } else {
            this.activeTags.delete(tag);
        }
        this.render();
    }

    setupDragScroll() {
        let isDown = false;
        let startX;
        let scrollLeft;

        this.container.addEventListener('mousedown', (e) => {
            isDown = true;
            this.container.classList.add('active');
            startX = e.pageX - this.container.offsetLeft;
            scrollLeft = this.container.scrollLeft;
        });

        this.container.addEventListener('mouseleave', () => {
            isDown = false;
            this.container.classList.remove('active');
        });

        this.container.addEventListener('mouseup', () => {
            isDown = false;
            this.container.classList.remove('active');
        });

        this.container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - this.container.offsetLeft;
            const walk = (x - startX) * 1; 
            this.container.scrollLeft = scrollLeft - walk;
        });
    }

    // New Stack Logic
    assignStackLevels(filteredItems) {
        // Enforce Layout: Periods Above, Events Below
        filteredItems.forEach(item => {
            if (item.type === 'period') {
                item.position = 'above';
            } else {
                item.position = 'below';
            }
        });

        // Separate by position
        const aboveItems = filteredItems.filter(i => i.position === 'above');
        const belowItems = filteredItems.filter(i => i.position === 'below');

        const assign = (items) => {
            const levels = []; // Array of end pixels for each level
            items.forEach(item => {
                const startPx = this.dateToPixel(item.startDate);
                let endPx;
                
                if (item.type === 'period' && item.endDate) {
                    endPx = this.dateToPixel(item.endDate);
                } else {
                    // For events, estimate width based on text length roughly
                    // Heuristic: 140px for title + padding to be safe
                    endPx = startPx + 140; 
                }
                
                // Add padding between items
                const itemEndWithPadding = endPx + 10; // Tight padding

                // Find first level that is free
                let levelIndex = -1;
                for (let i = 0; i < levels.length; i++) {
                    if (levels[i] < startPx) {
                        levelIndex = i;
                        break;
                    }
                }

                if (levelIndex === -1) {
                    levelIndex = levels.length;
                    levels.push(0);
                }

                levels[levelIndex] = itemEndWithPadding;
                item._stackLevel = levelIndex;
            });
        };

        assign(aboveItems);
        assign(belowItems);
    }

    render() {
        const axis = this.content.querySelector('.axis');
        this.content.innerHTML = '';
        this.content.appendChild(axis);

        const totalDays = (this.maxDate - this.minDate) / (1000 * 60 * 60 * 24);
        const totalWidth = totalDays * this.zoomLevel;
        this.content.style.width = `${totalWidth}px`;

        const filteredItems = this.data.filter(item => {
            return item.tags.some(t => this.activeTags.has(t));
        });

        this.assignStackLevels(filteredItems);

        filteredItems.forEach(item => {
            const el = document.createElement('div');
            el.className = `timeline-item ${item.type} ${item.position}`;
            el.textContent = item.title;
            
            // Apply Dynamic Colors
            const color = this.getItemColor(item);
            if (item.type === 'event') {
                el.style.backgroundColor = '#fff';
                el.style.color = '#333';
                el.style.borderColor = color;
                el.style.borderWidth = '3px';
            } else { // period
                el.style.backgroundColor = color;
                el.style.borderColor = color;
                // Text color already white in CSS for periods
            }

            // Add click listener
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onEventClick(item);
            });

            const startPx = this.dateToPixel(item.startDate);
            el.style.left = `${startPx}px`;

            if (item.type === 'period' && item.endDate) {
                const endPx = this.dateToPixel(item.endDate);
                const width = Math.max(endPx - startPx, 10); // Ensure min width is visible
                el.style.width = `${width}px`;
            }

            // Stack positioning
            const level = item._stackLevel || 0;
            const baseOffset = 25; // Compact base offset
            const levelHeight = 38; // Compact level height
            const offset = baseOffset + (level * levelHeight);

            // Create connector line
            const line = document.createElement('div');
            line.className = 'connector-line';
            line.style.position = 'absolute';
            line.style.left = `${startPx}px`;
            line.style.width = '2px';
            line.style.height = `${offset}px`;
            line.style.backgroundColor = color; // Match item color
            line.style.opacity = '0.5';
            line.style.zIndex = '1';

            if (item.position === 'above') {
                el.style.bottom = `calc(50% + ${offset}px)`;
                line.style.bottom = '50%';
            } else {
                el.style.top = `calc(50% + ${offset}px)`;
                line.style.top = '50%';
            }
            
            this.content.appendChild(line);
            this.content.appendChild(el);
        });

        this.renderTicks(totalDays);
    }

    renderTicks(totalDays) {
        // Clear old ticks first if any (actually render clears innerHTML so we are good)
        
        let step = 1; 
        let labelFormat = 'day'; // day, month, year

        if (this.zoomLevel >= 20) {
            step = 1; // 1 day
            labelFormat = 'day';
        } else if (this.zoomLevel >= 5) {
            step = 7; // 1 week
            labelFormat = 'day';
        } else if (this.zoomLevel >= 1) {
            step = 30; // ~1 month
            labelFormat = 'month';
        } else if (this.zoomLevel >= 0.1) {
            step = 365; // 1 year
            labelFormat = 'year';
        } else {
            step = 365 * 10; // 10 years
            labelFormat = 'year';
        }
        
        for (let i = 0; i <= totalDays; i += step) {
            const current = new Date(this.minDate);
            current.setDate(current.getDate() + i);
            
            const px = this.dateToPixel(current);
            
            // Skip if out of bounds (though loop handles it)
            
            const tick = document.createElement('div');
            tick.className = 'tick';
            tick.style.left = `${px}px`;
            
            const label = document.createElement('div');
            label.className = 'tick-label';
            
            if (labelFormat === 'year') {
                label.textContent = current.getFullYear();
            } else if (labelFormat === 'month') {
                label.textContent = current.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
            } else {
                label.textContent = current.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }
            
            tick.appendChild(label);
            this.content.appendChild(tick);
        }
    }
}