window.CKEditorInterop = (() => {
    const editors = {};

    return {
        init(id, dotNetReference) {
            // config is optional
            ClassicEditor
                // The autosave feature listens to the editor.model.document#change:data event, throttles it and executes the config.autosave.save() function.
                .create(document.getElementById(id), {
                    autosave: {
                        save(editor) {
                            let data = editor.getData();
                            console.log(data);
                            return dotNetReference.invokeMethodAsync('EditorAutoSave', data);
                            // The saveData() function must return a promise
                            // which should be resolved when the data is successfully saved.
                            // return saveData(editor[id].getData());
                        }
                    }
                })
                .then(editor => {
                    editors[id] = editor;
                    // listening to change data
                    editor.model.document.on('change:data', () => {
                        let data = editor.getData();

                        const el = document.createElement('div');
                        el.innerHTML = data;
                        if (el.innerText.trim() == '')
                            data = null;

                        dotNetReference.invokeMethodAsync('EditorDataChanged', data);

                        displayStatus(editor);
                    });
                })
                .catch(error => console.error(error));
        },
        destroy(id) {
            editors[id].destroy()
                .then(() => delete editors[id])
                .catch(error => console.log(error));
        }
    };
})();


// Update the "Status: Saving..." info.
function displayStatus(editor) {
    const pendingActions = editor.plugins.get('PendingActions');
    const statusIndicator = document.querySelector('#editor-status');

    pendingActions.on('change:hasAny', (evt, propertyName, newValue) => {
        if (newValue) {
            statusIndicator.classList.add('alert-danger');
            statusIndicator.classList.remove('saved');
        } else {
            statusIndicator.classList.remove('alert-danger');
            statusIndicator.classList.add('saved');
        }
    });
}