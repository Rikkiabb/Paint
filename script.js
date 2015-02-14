//Class that keeps track of all the global variables.
function API(){
    this.shapes = [];
    this.undoShapes = [];
    this.nextColor = "Black";
    this.nextForm = "Pen";
    this.nextThickness = 2;
    this.startX = 0;
    this.startY = 0;
    this.isDrawing = false;
    this.isWritingText = false;
    this.isMoving = false;
    this.indexOfMovingObject = -1;
    var canvas = document.getElementById('myCanvas');
    this.context = canvas.getContext("2d");
    
    //Draws all shapes.
    this.drawAll = function drawAll(){
        
        for(var i = 0; i < this.shapes.length; i++){
            
            if(this.shapes[i].form === "Rectangle"){
                this.shapes[i].draw(this.shapes[i].w, this.shapes[i].h);
            }else if(this.shapes[i].form === "Circle"){
                this.shapes[i].draw(this.shapes[i].x, this.shapes[i].y, this.shapes[i].radius);
            }else if(this.shapes[i].form === "Line"){
                this.shapes[i].draw(this.shapes[i].x, this.shapes[i].y);
            }else if(this.shapes[i].form === "Text"){
                this.shapes[i].draw();
            }else if(this.shapes[i].form === "Pen"){
                this.shapes[i].draw();
            }
            
        }
    
    }
    
}

var app = new API();

//Is called when a picture is being loaded. And behold, the function loads the picture.
function load(){
    
    var param =  {   "user": "stefanh13",
				    "template": false
			     };
    
    var name = $(this).attr("name");

    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        url: "http://whiteboard.apphb.com/Home/GetList",
        data: param,
        dataType: "jsonp",
        crossDomain: true,
        success: function (data) {
            
            var id;
            //Find the id of the picture being loaded.
            for(var i = 0; i < data.length; i++){

                if(name === data[i].WhiteboardTitle){
                    id = data[i].ID;
                    break;
                }
            }
            
            var param2 = { 
                            "ID": id
                         };

            $.ajax({
                type: "POST",
                contentType: "application/json; charset=utf-8",
                url: "http://whiteboard.apphb.com/Home/GetWhiteboard",
                data: param2,
                dataType: "jsonp",
                crossDomain: true,
                success: function (data) {
                    
                    //Empty the array.
                    app.shapes.splice(0, app.shapes.length);
                    //The string to be loaded.
                    var objStr = data.WhiteboardContents.substring(1, data.WhiteboardContents.length - 1);
                    //Count [ parentheses to know when to split the string.
                    var counter = 1;
                    var oldIndex = 0;
                    //Will contain the loaded shapes.
                    var shape = [];

                    //Split upp the object string.
                    for(var i = 0; i < objStr.length - 1; i++){

                        var c1 = objStr.charAt(i);
                        var c2 = objStr.charAt(i + 1);
                        
                        if(c1 === "["){
                            counter++;
                        }else if(c1 === "]"){
                            counter--;
                        }
                        
                        if(counter === 1){

                            if(c1 === "," && c2 === "{"){

                                shape.push(JSON.parse(objStr.substring(oldIndex, i)));
                                oldIndex = i+1;
                            }
                        }
                    }
                    
                    //Push the last object in the string.
                    shape.push(JSON.parse(objStr.substring(oldIndex, i + 1)));

                    //Go trough shape and add shapes to app.shapes, acoarding to their form.
                    for(var i = 0; i < shape.length; i++){

                        if(shape[i].form === "Rectangle"){
                            app.shapes.push(new Rectangle(shape[i].x, shape[i].y, shape[i].color, shape[i].w, shape[i].h,                                                         shape[i].penSize, "Rectangle"));
                        }else if(shape[i].form === "Circle"){
                            app.shapes.push(new Circle(shape[i].x, shape[i].y, shape[i].color, shape[i].radius, shape[i].penSize,                                                 "Circle"));    
                        }else if(shape[i].form === "Pen"){
                            var pen = new Pen(shape[i].x, shape[i].y, shape[i].color, shape[i].penSize, "Pen");

                            for(var j = 0; j < shape[i].points.length; j++){
                                pen.points.push(shape[i].points[j]);
                            }
                            
                            app.shapes.push(pen);
                        }else if(shape[i].form === "Line"){
                            app.shapes.push(new Line(shape[i].x, shape[i].y, shape[i].x0, shape[i].y0, shape[i].color,                                                                    shape[i].penSize, "Line"));
                        }else if(shape[i].form === "Text"){
                            app.shapes.push(new Text(shape[i].x, shape[i].y, shape[i].color, shape[i].penSize, "Text",                                                                    shape[i].text));
                        }else if(shape[i].form === "Eraser"){
                            app.shapes.push(new Pen(shape[i].x, shape[i].y, "white", shape[i].penSize, "Pen"));
                        }

                    }

                    app.context.clearRect(0, 0, 1260, 500);
                    app.drawAll();

                },
                error: function (xhr, err) {
                
                }
            });
        },
        error: function (xhr, err) {
            
        }
    });

};

$("#saveButton").on('click', function save(e){
    
    var name = $('#save').val();
    var stringifiedArray = JSON.stringify(app.shapes);
    
    var param = {   
                    "user": "stefanh13",
				    "name": name,
				    "content": stringifiedArray,
				    "template": false
                };

    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        url: "http://whiteboard.apphb.com/Home/Save",
        data: param,
        dataType: "jsonp",
        crossDomain: true,
        success: function (data) {

            //Add a new file to the load list.
            $("ul.dropdown-menu:last-child").append('<li role="presentation" id="load"><a role="menuitem" href="#">' + name +'</a>                  </li>').click(load);
            $('#save').val("");
            $("ul.dropdown-menu:last-child").attr("name", name);
        },
        error: function (xhr, err) {
            
        }
    });


});

$("#undo").on('click', function undo(e){
    
    var size = app.shapes.length;
    //Don't allow undo-ing if app.shapes is empty.
    if(size === 0){
        return;
    }
    
    app.undoShapes.push(app.shapes[size - 1]);
    app.shapes.pop();
    
    app.context.clearRect(0, 0, 1260, 500);
    app.drawAll();
});

$("#redo").on('click', function redo(e){

    var size = app.undoShapes.length;
    //Don't allow redo-ing if the app.undoShapes is empty.
    if(size === 0){
        return;
    }
    
    app.shapes.push(app.undoShapes[size - 1]);
    app.undoShapes.pop();
    
    app.context.clearRect(0, 0, 1260, 500);
    app.drawAll();
    
});

              

$("#thicknessButton").on('click', function getPenSize(e){
    
    var size = $("#penThickness").val();
    //We don't what the size to be negative.
    if(size >= 0){
        app.nextThickness = size;
    }
    
    $("#penThickness").val("");
    
});

$('.btn').on('click', function getColorAndForm(e) {
    
        if($(this).data('type') === "colorButton"){
            app.nextColor = $(this).data('litur');
        }
        else if($(this).data('type') === "toolButton"){
            app.nextForm = $(this).data('form');
            //The user should not be able to after selecting a tool.
            app.isMoving = false;
        }else if($(this).data('type') === "moveButton"){
            app.isMoving = true;
        }
        
    });
    
$('#myCanvas').on('mousedown', function mouseIsDown(e){

    //If user is writing a text, then he shouldn't be able to do anything else.
    if(app.isWritingText === true){
        return;
    }

    //When a shape is drawn, then empty the undoshapes array.
    app.undoShapes.splice(0, app.undoShapes.length);

    //Get x and y coordinates of the mouse.
    app.startX = e.pageX - this.offsetLeft;
    app.startY = e.pageY - this.offsetTop;
    
    app.context.moveTo(app.startX, app.startY);
    app.isDrawing = true;

    if(app.isMoving === true){

        //Check if mouse x and y are within any of the shapes.
        for(var i = app.shapes.length - 1; i >= 0; i--){

            if(app.shapes[i].isInsideShape(app.startX, app.startY) === true){
                
                //For moving purposes in the mousemove function.
                app.indexOfMovingObject = i;
                return;
            }
        }

    }else{
        //If we are not moving objects, then we are drawing them.
        
        if(app.nextForm === "Rectangle"){
            app.shapes.push(new Rectangle(app.startX, app.startY, app.nextColor, 0, 0, app.nextThickness, "Rectangle"));
        }else if(app.nextForm === "Circle"){
            app.shapes.push(new Circle(app.startX, app.startY, app.nextColor, 0, app.nextThickness, "Circle"));    
        }else if(app.nextForm === "Pen"){

            app.shapes.push(new Pen(app.startX, app.startY, app.nextColor, app.nextThickness, "Pen"));

            app.context.lineWidth = app.nextThickness;
            app.context.strokeStyle = app.nextColor;

        }else if(app.nextForm === "Line"){
            app.shapes.push(new Line(app.startX, app.startY, app.startX, app.startY, app.nextColor, app.nextThickness, "Line"));
        }else if(app.nextForm === "Text"){

            //Move the textbox to the coordinates of the mouse click.
            $("#textBox").css("display", "inline");
            $("#textBox").css("position", "absolute");
            $("#textBox").css("top", e.pageY);
            $("#textBox").css("left", e.pageX);
            
            //To prevent any any drawings while writing a text.
            app.isDrawing = false;
            app.isWritingText = true;

        }else if(app.nextForm === "Eraser"){
            //Eraser is just a pen that is white.
            app.shapes.push(new Pen(app.startX, app.startY, "white", app.nextThickness, "Pen"));
        }

    }


});
    
$('#myCanvas').on('mousemove', function mouseIsMoving(e){
    
    //Only if we are drawing then we want to do something when the mouse moves.
    if(app.isDrawing === true){

        //Check if we are moving objects.
        if(app.isMoving === true){

            //If object was not found when canvas was clicked.
            if(app.indexOfMovingObject != -1){
                
                //Special case for pen and line. Calculate the diffirence between original points and mouse x and y.
                if(app.shapes[app.indexOfMovingObject].form === "Pen" || app.shapes[app.indexOfMovingObject].form === "Line"){

                    app.shapes[app.indexOfMovingObject].move(e.pageX - this.offsetLeft - app.startX, e.pageY - this.offsetTop -                                                                    app.startY);
                    app.startX = e.pageX - this.offsetLeft;
                    app.startY = e.pageY - this.offsetTop;

                }else{
                    app.shapes[app.indexOfMovingObject].move(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
                }

            }

            app.context.clearRect(0, 0, 1260, 500);
            app.drawAll();
            
            //Return so we don't start drawing things.
            return;
        }

        app.context.clearRect(0, 0, 1260, 500);
        app.drawAll();

        var size = app.shapes.length;
        
        if(app.nextForm === "Rectangle"){

            var w = e.pageX - this.offsetLeft - app.startX;
            var h = e.pageY - this.offsetTop - app.startY;

            app.shapes[size-1].draw(w, h);

        }else if(app.nextForm === "Circle"){

            var x = e.pageX - this.offsetLeft;
            var y = e.pageY - this.offsetTop;
            var radius = Math.sqrt(Math.pow(app.startX - x, 2) + Math.pow(app.startY - y, 2));

            app.shapes[size-1].draw(x, y, radius);

        }else if(app.nextForm === "Pen" || app.nextForm === "Eraser"){

            var x = e.pageX - this.offsetLeft;
            var y = e.pageY - this.offsetTop;
            
            app.shapes[size-1].points.push({x: x, y: y});
            app.context.lineJoin = "round";
            app.context.lineCap = "round";
            app.context.lineTo(x, y);
            app.context.stroke();
            
            //To skip call to drawAll function to increase speed.
            return;

        }else if(app.nextForm === "Line"){

            var x = e.pageX - this.offsetLeft;
            var y = e.pageY - this.offsetTop;

            app.shapes[size-1].draw(x, y);
        }

        app.context.clearRect(0, 0, 1260, 500);
        app.drawAll();

    }
});
        
    
$('#myCanvas').on('mouseup', function mouseIsUp(e){

    app.isDrawing = false;
    app.indexOfMovingObject = -1;

});

$( "#textBox" ).keypress(function enterWasPressed(e) {
    
    //If enter is pressed.
    if(e.which === 13){
        
        var text = $("#textBox").val();
        app.shapes.push(new Text(app.startX, app.startY, app.nextColor, app.nextThickness, "Text", text));

        $("#textBox").val("");
        $("#textBox").css("display", "none");

        var size = app.shapes.length;
        app.shapes[size - 1].draw();
        //Allow other things to be drawn.
        app.isWritingText = false;
    }

});


var Shape = Base.extend({
    
    constructor: function(x, y, color, pSize, form){
        
        this.x = x;
        this.y = y;
        this.color = color;
        this.penSize = pSize;
        this.form = form;
    }

});

var Rectangle = Shape.extend({
    
    constructor: function(x, y, color, w, h, pSize, form){
        
        this.base(x, y, color, pSize, form);
        //Width
        this.w = w;
        //Height
        this.h = h;
        
    },
    
    draw: function(w, h){
        
        this.w = w;
        this.h = h;
    
        app.context.strokeStyle = this.color;
        app.context.lineWidth = this.penSize;
        app.context.beginPath();
        app.context.strokeRect(this.x, this.y, this.w, this.h);
        
    },
    
    isInsideShape: function(x, y){
        
        return (this.x <= x) && (this.y <= y) && (this.x + this.w >= x) && (this.y + this.h >= y);
    },
    
    move: function(x, y){
        this.x = x;
        this.y = y;
    }
    
});

var Circle = Shape.extend({
    
    constructor: function(x, y, color, radius, pSize, form){
        
        this.base(x, y, color, pSize, form);
        this.radius = radius;
    },
    
    draw: function(x, y, radius){
        
        this.x = x;
        this.y = y;
        this.radius = radius;
        
        app.context.lineWidth = this.penSize;
        app.context.strokeStyle = this.color;
        app.context.beginPath();
        app.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        app.context.stroke();
    },
    
    isInsideShape: function(x, y){
        
        return (Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)) <= Math.pow(this.radius, 2);
    },
    
    move: function(x, y){
        
        this.x = x;
        this.y = y;
    }

});

var Line = Shape.extend({

    constructor: function(x, y, x0, y0, color, pSize, form){
        
        this.base(x, y, color, pSize, form);
        //Begin x coordinate of the line.
        this.x0 = x0;
        //Begin y coordinate of the line.
        this.y0 = y0;
    },
    
    draw: function(x, y){
        
        this.x = x;
        this.y = y;
        
        app.context.strokeStyle = this.color;
        app.context.lineWidth = this.penSize;
        app.context.lineJoin = "miter";
        app.context.lineCap = "square";
        app.context.beginPath();
        app.context.moveTo(this.x0, this.y0);
        app.context.lineTo(this.x, this.y);
        app.context.stroke();
                
    },
    
    isInsideShape: function(x, y){
        
        var w, h;
        
        w = Math.abs(this.x0 - this.x);
        h = Math.abs(this.y0 - this.y);
        //Check if the click was inside the lines box.
        return (Math.min(this.x0, this.x) <= x) && (Math.min(this.y0, this.y) <= y) && (Math.min(this.x0, this.x) + w >= x) &&                      (Math.min(this.y0, this.y) + h >= y);
        
    },
    
    move: function(x, y){
        
        this.x0 += x;
        this.y0 += y;
        this.x += x;
        this.y += y;
    }
});

var Text = Shape.extend({

    constructor: function(x, y, color, pSize, form, text){
        
        this.base(x, y, color, pSize, form);
        this.text = text;
    },
    
    draw: function(){
    
        app.context.fillStyle = this.color;
        app.context.font = this.penSize * 5 + "px Arial";
        app.context.fillText(this.text, this.x, this.y);
    },
    
    isInsideShape: function(x,y){
        
        var h = this.penSize * 2 * 1.5;
        var w = app.context.measureText(this.text).width;
        
        //Check if the click was inside the text's box.
        return (this.x <= x) && (this.y - h <= y) && (this.x + w >= x) && (this.y >= y);
    
    },
    
    move: function(x, y){
        
        this.x = x;
        this.y = y;
    }
    
});

var Pen = Shape.extend({

    constructor: function(x, y, color, pSize, form){
        
        this.base(x, y, color, pSize, form);
        this.points = [];
        this.points.push({x: x, y: y});
    },
    
    draw: function(){
        
        app.context.strokeStyle = this.color;
        app.context.lineWidth = this.penSize;
        app.context.lineJoin = "round";
        app.context.lineCap = "round";
        app.context.beginPath();
        app.context.moveTo(this.points[0].x, this.points[0].y);
        
        for(var i = 0; i < this.points.length; i++){
            
            app.context.lineTo(this.points[i].x, this.points[i].y);
        }
        
        app.context.stroke();
    },
    
    isInsideShape: function(x, y){
    
        var spaceX, spaceY;
        
        for(var i = 0; i < this.points.length; i++){
            
            spaceX = x - this.points[i].x;
            spaceY = y - this.points[i].y;
            //Check a x and y +- 10 so the user doesn't have to accuratly click the drawing.
            if(spaceX <= 10 && spaceX >= -10 && spaceY <= 10 && spaceY >= -10){
                return true;
            }
        }
        
        return false;
    },
    
    move: function(x, y){
        
        for(var i = 0; i < this.points.length; i++){
            this.points[i].x += x;
            this.points[i].y += y;
        }
    }
});


