export class Timeline {
    constructor(containerId, data, onEventClick) {
        this.container = document.getElementById(containerId);
        this.content = this.container.querySelector('.timeline-content');
        this.data = this.parseData(data);
        this.onEventClick = onEventClick || (() => {});
        
        // Extended Palette
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

        // DOM Structure Setup
        this.content.innerHTML = '';
        this.axis = document.createElement('div');
        this.axis.className = 'axis';
        this.content.appendChild(this.axis);

        this.ticksContainer = document.createElement('div');
        this.ticksContainer.className = 'ticks-container';
        this.content.appendChild(this.ticksContainer);
        
        this.itemsContainer = document.createElement('div');
        this.itemsContainer.className = 'items-container';
        this.content.appendChild(this.itemsContainer);

        this.itemElements = new Map(); // Cache for item DOM elements

        this.minDate = this.getMinDate();
        this.maxDate = this.getMaxDate();
        // Add padding
        this.minDate.setDate(this.minDate.getDate() - 365); 
        this.maxDate.setDate(this.maxDate.getDate() + 365);

        // Auto-calculate initial zoom
        const totalDays = (this.maxDate - this.minDate) / (1000 * 60 * 60 * 24);
        const containerWidth = this.container.clientWidth || 1200;
        let initialZoom = containerWidth / totalDays;
        
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
        const uniqueKey = item.id ? item.id.toString() : (item.title + item.start);
        const hash = Math.abs(this._hashString(uniqueKey));
        return this.colors[hash % this.colors.length];
    }

    parseData(data) {
        return data.map(item => {
            // For periods with no end date, use current date
            const endDate = item.end
                ? new Date(item.end)
                : (item.type === 'period' ? new Date() : null);

            return {
                ...item,
                startDate: new Date(item.start),
                endDate: endDate,
                uniqueId: item.id || Math.random().toString(36).substr(2, 9)
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

    getUniqueTags() {
        return this.tags;
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

    pixelToDate(px) {
        const diffDays = px / this.zoomLevel;
        const diffTime = diffDays * (1000 * 60 * 60 * 24);
        return new Date(this.minDate.getTime() + diffTime);
    }

    setZoom(level) {
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        this.render();
    }

    zoomIn() {
        this.animateZoom(this.zoomLevel * 1.5);
    }

    zoomOut() {
        this.animateZoom(this.zoomLevel / 1.5);
    }

    animateZoom(targetZoom) {
        const clampedTarget = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));
        const startZoom = this.zoomLevel;
        const delta = clampedTarget - startZoom;
        const duration = 400; // ms
        let startTime = null;

        // Center preservation
        const containerCenter = this.container.clientWidth / 2;
        const centerDate = this.pixelToDate(this.container.scrollLeft + containerCenter);

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing (easeInOutQuad)
            const ease = progress < .5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            
            this.zoomLevel = startZoom + (delta * ease);
            
            // 1. Update width first to prevent scroll clamping
            const totalDays = (this.maxDate - this.minDate) / (1000 * 60 * 60 * 24);
            this.content.style.width = `${totalDays * this.zoomLevel}px`;

            // 2. Adjust scroll to keep centerDate in center
            const newCenterPx = this.dateToPixel(centerDate);
            this.container.scrollLeft = newCenterPx - containerCenter;

            // 3. Render (Items + Ticks)
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

    assignStackLevels(filteredItems) {
        // Enforce Layout: Periods Above, Events Below
        filteredItems.forEach(item => {
            item.position = item.type === 'period' ? 'above' : 'below';
        });

        const aboveItems = filteredItems.filter(i => i.position === 'above');
        const belowItems = filteredItems.filter(i => i.position === 'below');

        const assign = (items) => {
            const levels = []; 
            items.forEach(item => {
                const startPx = this.dateToPixel(item.startDate);
                let endPx;
                
                if (item.type === 'period' && item.endDate) {
                    endPx = this.dateToPixel(item.endDate);
                } else {
                    endPx = startPx + 140; 
                }
                
                const itemEndWithPadding = endPx + 10;

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
        const totalDays = (this.maxDate - this.minDate) / (1000 * 60 * 60 * 24);
        const totalWidth = totalDays * this.zoomLevel;
        this.content.style.width = `${totalWidth}px`;

        const filteredItems = this.data.filter(item => {
            return item.tags.some(t => this.activeTags.has(t));
        });

        this.assignStackLevels(filteredItems);
        this.renderItems(filteredItems);
        this.renderTicks(totalDays);
    }

    renderItems(filteredItems) {
        // Mark all current elements as potentially disposable
        const activeIds = new Set();

        filteredItems.forEach(item => {
            activeIds.add(item.uniqueId);
            let el = this.itemElements.get(item.uniqueId);
            let line = null;

            if (!el) {
                // Create new Item
                el = document.createElement('div');
                line = document.createElement('div');
                line.className = 'connector-line';
                
                // Add click listener
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.onEventClick(item, e);
                });

                this.itemsContainer.appendChild(line);
                this.itemsContainer.appendChild(el);
                
                // Store both element and line
                el._lineElement = line;
                this.itemElements.set(item.uniqueId, el);
            } else {
                line = el._lineElement;
            }

            // Update content/styles
            el.className = `timeline-item ${item.type} ${item.position}`;
            el.textContent = item.title;
            
            const color = this.getItemColor(item);
            if (item.type === 'event') {
                el.style.backgroundColor = '#fff';
                el.style.color = '#333';
                el.style.borderColor = color;
                el.style.borderWidth = '3px';
            } else { 
                el.style.backgroundColor = color;
                el.style.borderColor = color;
            }

            const startPx = this.dateToPixel(item.startDate);
            el.style.left = `${startPx}px`;

            if (item.type === 'period' && item.endDate) {
                const endPx = this.dateToPixel(item.endDate);
                const width = Math.max(endPx - startPx, 10); 
                el.style.width = `${width}px`;
            } else {
                el.style.width = 'auto'; // Reset if it was reused from a period
            }

            // Stack positioning
            const level = item._stackLevel || 0;
            const baseOffset = 25; 
            const levelHeight = 38; 
            const offset = baseOffset + (level * levelHeight);

            // Update connector line
            line.style.left = `${startPx}px`;
            line.style.height = `${offset}px`;
            line.style.backgroundColor = color;
            line.style.opacity = '0.5';

            if (item.position === 'above') {
                el.style.bottom = `calc(50% + ${offset}px)`;
                el.style.top = 'auto';
                line.style.bottom = '50%';
                line.style.top = 'auto';
            } else {
                el.style.top = `calc(50% + ${offset}px)`;
                el.style.bottom = 'auto';
                line.style.top = '50%';
                line.style.bottom = 'auto';
            }
            
            el.style.display = 'block';
            line.style.display = 'block';
        });

        // Hide (don't delete) items that are filtered out to save GC
        this.itemElements.forEach((el, id) => {
            if (!activeIds.has(id)) {
                el.style.display = 'none';
                if (el._lineElement) el._lineElement.style.display = 'none';
            }
        });
    }

    renderTicks(totalDays) {
        // Ticks are cleared because their quantity changes drastically
        this.ticksContainer.innerHTML = '';
        
        let step = 1; 
        let labelFormat = 'day';

        if (this.zoomLevel >= 20) {
            step = 1; 
            labelFormat = 'day';
        } else if (this.zoomLevel >= 5) {
            step = 7; 
            labelFormat = 'day';
        } else if (this.zoomLevel >= 1) {
            step = 30; 
            labelFormat = 'month';
        } else if (this.zoomLevel >= 0.1) {
            step = 365; 
            labelFormat = 'year';
        } else {
            step = 365 * 10; 
            labelFormat = 'year';
        }
        
        // Optimization: Only render visible ticks
        const viewportLeft = this.container.scrollLeft;
        const viewportRight = viewportLeft + this.container.clientWidth;
        
        const startDay = Math.floor(viewportLeft / this.zoomLevel);
        const endDay = Math.ceil(viewportRight / this.zoomLevel);
        
        // Clamp to valid range
        const loopStart = Math.max(0, startDay - 50); // Buffer
        const loopEnd = Math.min(totalDays, endDay + 50);

        // Align loop start to step
        const alignedStart = loopStart - (loopStart % step);

        for (let i = alignedStart; i <= loopEnd; i += step) {
            const current = new Date(this.minDate);
            current.setDate(current.getDate() + i);
            
            const px = i * this.zoomLevel; 
            
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
            this.ticksContainer.appendChild(tick);
        }
    }
}