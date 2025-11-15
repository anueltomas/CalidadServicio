<div class="dialog-container">
    <div class="dialog record">
        <div class="dialog-content">
            <div class="dialog-header">
                <div class="dialog-header-title">{{headerHtml}}</div>
                <a class="close" data-action="close">
                    <span class="fas fa-times"></span>
                </a>
            </div>
            <div class="dialog-body">
                <div class="import-modal">
                    <div class="file-selection">
                        <input type="file" name="csvFile" accept=".csv" class="form-control">
                    </div>
                    <div class="file-info" style="margin-top: 10px;">
                        {{#if fileName}}
                            <div class="alert alert-info">
                                <i class="fas fa-file-csv"></i> Archivo seleccionado: {{fileName}}
                            </div>
                        {{/if}}
                    </div>
                    <div class="validation-info" style="margin-top: 10px;"></div>
                    <div class="progress" style="margin-top: 10px; display: none;">
                        <div class="progress-bar progress-bar-success progress-bar-striped active" 
                             role="progressbar" style="width: 0%">
                            <span class="sr-only">Importando...</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="dialog-footer">
                {{#each buttonList}}
                    <button 
                        class="btn btn-{{style}} {{#if disabled}}disabled{{/if}}" 
                        data-action="{{name}}"
                        {{#if disabled}}disabled{{/if}}>
                        {{label}}
                    </button>
                {{/each}}
            </div>
        </div>
    </div>
    <div class="dialog-backdrop in"></div>
</div>