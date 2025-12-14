<div class="container">
    <div class="panel panel-default">
        <div class="panel-heading">
            <h3 class="panel-title">🎯 Página de Prueba Simple</h3>
        </div>
        <div class="panel-body">
            <h4>✅ ¡Funciona!</h4>
            <p>Esta es una página de prueba simple.</p>
            
            <div class="well">
                <p><strong>Información de depuración:</strong></p>
                <p>Hash actual: <code id="current-hash"></code></p>
                <p>Parámetros recibidos: <code id="params-received"></code></p>
                <p>App cargada: <span id="app-status"></span></p>
                <p>Router disponible: <span id="router-status"></span></p>
            </div>
            
            <button class="btn btn-primary" data-action="volver">Volver al Inicio</button>
            <button class="btn btn-success" data-action="probar">Probar Navegación</button>
        </div>
    </div>
</div>

<script>
// Script inline para mostrar info
$(document).ready(function() {
    $('#current-hash').text(window.location.hash);
    $('#app-status').text(window.app ? '✅ Sí' : '❌ No');
    $('#router-status').text(window.app && window.app.router ? '✅ Sí' : '❌ No');
});
</script>