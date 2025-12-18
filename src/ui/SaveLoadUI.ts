import { World } from '../core/World';
import { Serializer } from '../core/Serializer';

export class SaveLoadUI {
    container: HTMLDivElement;
    world: World;
    isVisible: boolean = false;

    constructor(world: World) {
        this.world = world;
        this.container = document.createElement('div');
        this.container.id = 'save-load-overlay';
        this.container.style.display = 'none';
        this.container.innerHTML = `
            <div class="save-load-modal">
                <h2>Save / Load Worlds</h2>
                <div class="sl-section">
                    <h3>Save Current World</h3>
                    <div class="input-group">
                        <input type="text" id="save-name" placeholder="World Name" />
                        <button id="save-btn">Save to Server</button>
                    </div>
                </div>
                <div class="sl-section">
                    <h3>Load from File</h3>
                    <div class="input-group">
                        <input type="file" id="load-file" accept=".sand" />
                        <button id="load-file-btn">Load</button>
                    </div>
                </div>
                <div class="sl-section">
                    <h3>Server Worlds</h3>
                    <ul id="world-list"></ul>
                </div>
                <div class="sl-footer">
                   <button id="close-sl-btn">Close</button>
                </div>
            </div>
            <div id="confirm-dialog" class="confirm-overlay" style="display: none;">
                <div class="confirm-box">
                    <div class="confirm-icon">⚠️</div>
                    <h3 id="confirm-title">Delete World?</h3>
                    <p id="confirm-message">Are you sure you want to delete this world?</p>
                    <div class="confirm-buttons">
                        <button id="confirm-cancel" class="confirm-btn cancel">Cancel</button>
                        <button id="confirm-yes" class="confirm-btn danger">Delete</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);

        this.setupEvents();
    }

    setupEvents() {
        // Toggle visibility via a new button in the main UI (to be added)
        // Or we expose a toggle method.

        document.getElementById('close-sl-btn')?.addEventListener('click', () => {
            this.hide();
        });

        document.getElementById('save-btn')?.addEventListener('click', () => {
            const nameInput = document.getElementById('save-name') as HTMLInputElement;
            const name = nameInput.value.trim();
            if (name) {
                this.saveWorld(name);
                nameInput.value = '';
            }
        });

        document.getElementById('load-file-btn')?.addEventListener('click', () => {
            const fileInput = document.getElementById('load-file') as HTMLInputElement;
            const file = fileInput.files?.[0];
            if (file) {
                this.loadFromFile(file);
            } else {
                alert('Please select a .sand file first.');
            }
        });
    }

    show() {
        this.container.style.display = 'flex';
        this.isVisible = true;
        this.refreshList();
    }

    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
    }

    async saveWorld(name: string) {
        try {
            console.log('Serializing world...');
            const data = Serializer.serialize(this.world.grid);

            console.log(`Uploading ${name} (${data.length} bytes)...`);
            const res = await fetch(`http://localhost:3001/api/worlds/${name}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
                body: new Blob([data.buffer as ArrayBuffer])
            });

            if (res.ok) {
                alert('World saved!');
                this.refreshList();
            } else {
                alert('Failed to save world.');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving world. Is the server running?');
        }
    }

    async loadWorld(name: string) {
        try {
            const res = await fetch(`http://localhost:3001/api/worlds/${name}`);
            if (!res.ok) throw new Error('Failed to fetch');

            const blob = await res.blob();
            const buffer = await blob.arrayBuffer();
            const data = new Uint8Array(buffer);

            Serializer.deserialize(data, this.world.grid);
            alert(`Loaded ${name}`);
            this.hide();
        } catch (e) {
            console.error(e);
            alert('Error loading world.');
        }
    }

    async loadFromFile(file: File) {
        try {
            const buffer = await file.arrayBuffer();
            const data = new Uint8Array(buffer);

            Serializer.deserialize(data, this.world.grid);
            alert(`Loaded ${file.name}`);
            this.hide();
        } catch (e) {
            console.error(e);
            alert('Error loading file. Make sure it is a valid .sand file.');
        }
    }

    async downloadWorld(name: string) {
        // Trigger browser download of the server file
        // We can just link to it if we had a direct link, but API is better.
        try {
            const res = await fetch(`http://localhost:3001/api/worlds/${name}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const blob = await res.blob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${name}.sand`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Download failed');
        }
    }

    async refreshList() {
        const list = document.getElementById('world-list')!;
        list.innerHTML = 'Loading...';

        try {
            const res = await fetch('http://localhost:3001/api/worlds');
            if (res.ok) {
                const worlds = await res.json() as string[];
                list.innerHTML = '';
                worlds.forEach(w => {
                    const li = document.createElement('li');
                    li.className = 'world-item';

                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = w;

                    const actions = document.createElement('div');
                    actions.className = 'world-actions';

                    const loadBtn = document.createElement('button');
                    loadBtn.textContent = 'Load';
                    loadBtn.onclick = () => this.loadWorld(w);

                    const dlBtn = document.createElement('button');
                    dlBtn.textContent = 'Download';
                    dlBtn.onclick = () => this.downloadWorld(w);

                    const delBtn = document.createElement('button');
                    delBtn.textContent = 'Delete';
                    delBtn.className = 'delete-btn';
                    delBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.deleteWorld(w);
                    });

                    actions.appendChild(loadBtn);
                    actions.appendChild(dlBtn);
                    actions.appendChild(delBtn);

                    li.appendChild(nameSpan);
                    li.appendChild(actions);
                    list.appendChild(li);
                });
            }
        } catch (e) {
            list.innerHTML = 'Failed to connect to server.';
        }
    }

    private showConfirm(worldName: string): Promise<boolean> {
        return new Promise((resolve) => {
            const dialog = document.getElementById('confirm-dialog')!;
            const message = document.getElementById('confirm-message')!;
            const cancelBtn = document.getElementById('confirm-cancel')!;
            const yesBtn = document.getElementById('confirm-yes')!;

            message.textContent = `Are you sure you want to delete "${worldName}"? This cannot be undone.`;
            dialog.style.display = 'flex';

            const cleanup = () => {
                dialog.style.display = 'none';
                cancelBtn.onclick = null;
                yesBtn.onclick = null;
            };

            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };

            yesBtn.onclick = () => {
                cleanup();
                resolve(true);
            };
        });
    }

    async deleteWorld(name: string) {
        const confirmed = await this.showConfirm(name);
        if (!confirmed) return;

        try {
            const res = await fetch(`http://localhost:3001/api/worlds/${name}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                this.refreshList();
            } else {
                alert('Failed to delete world.');
            }
        } catch (e) {
            console.error('Delete error:', e);
            alert('Error deleting world. Is the server running?');
        }
    }
}
