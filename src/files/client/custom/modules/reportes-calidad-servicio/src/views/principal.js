
define(['view'], function (View, $) {
    
    return View.extend({
        
        template: 'reportes-calidad-servicio:principal',
        
        events: {
            
        },

        setup: function () {
            this.wait(true);
            this.cargarDatos();
        },


        data: function () {
            return {
                totalEncuestados: "1000"
            };
        }, 

        cargarDatos: function() {
            this.getCollectionFactory().create('Principal', function(collection) {
                collection.fetch({
                    data: {
                        maxSize: 200,
                        orderBy: 'orden',
                        order: 'asc'
                    }
                }).then(function() {
                    collection.models.forEach(function(categoria) {
                        var nombre = categoria.get('name');
                        console.log(nombre);
                        if (nombre && nombre.toLowerCase() !== 'general') {
                            this.reportOptions.push({
                                id: 'detalle-' + this.slugify(nombre),
                                label: nombre,
                                icon: 'fas fa-chart-bar'
                            });
                        }
                    }.bind(this));
                    
                    this.wait(false);
                }.bind(this)).catch(function(xhr) {
                    console.warn('No se pudieron cargar categorías. Probablemente no hay ninguna creada aún.');
                    this.wait(false);
                }.bind(this));
            }.bind(this));
        }
        
        
    });
});