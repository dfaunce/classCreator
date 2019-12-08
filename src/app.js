$(function() {
  
  function getInt(str) {
    return (isNaN(str) || str === "" || typeof(str) === 'undefined' || str == null) ? -Infinity : parseInt(str);
  }
  
  
  var CustomObjects = function() {
    
    var $className = $("#clsName");
    var $dbName = $("#dbName");
    var $btnObject = $("#btnCreateObject");
    var $container = $("#objects-container");
    var $finish = $("#btn-finish");
    
	/* ************************************************************************************************************************** */
	/* ----------------------------------------------------- USER INTERFACE ----------------------------------------------------- */
	/* ************************************************************************************************************************** */
	//Create Object
    function createObject() {
      var className= $.trim($className.val());
      var dbName = $.trim($dbName.val());
      if (className == null || className.length == 0 || dbName == null || dbName.length == 0) {
        alert("ERROR:\nPlease list a Class Name and a Database Name");
        return;
      }

      var num = getInt($container.attr("data-num"));
      num++;
      $container.attr("data-num", num);
      var $newObject = $container.find(".object:last-child").clone(true, true);
      $newObject.find(".object-table").attr("data-rows", "1");
      $newObject.attr({"data-num": num, "data-static": "0"});
      $container.prepend($newObject);
    }
    $btnObject.on("click", createObject);
    
    
    //Delete Object
    function deleteObject($obj) {
      var n = $.trim($obj.find(".object-name").val());
      var answer = confirm("Are you sure you want to delete the object [" + n + "]");
      if (answer) {
        $obj.remove();
      }     
    }
    $(document).on("click", ".btn-delete-object", function() {
      deleteObject($(this).parents(".object"));
    });
    
    
    //Add record 
    function addRecord($table) {
      var $tbody = $table.children("tbody");
      var $o = $tbody.find("tr:first-child").clone(true, true);
      var i = getInt($table.attr("data-rows"));
      i++;
      $table.attr("data-rows", i);
      $o.attr("data-row", i);
      $o.find(".td-name").text("");
      $o.find(".sel-record-type").prop("selectedIndex", 0);
      $o.find(".td-default").text("");
      $tbody.append($o);
    }
    $(document).on("click", ".btn-add-record", function() {
      addRecord($(this).parents(".object").find(".object-table"));
    });    
    
    //Delete record
    function deleteRecord($record) {
      $record.remove();
    }
    $(document).on("click", ".btn-delete-record", function() {
      deleteRecord($(this).parents("tr"));
    });
    
    //Toggle Hide/Show Table
    $(document).on("click", ".btn-hide-show", function() {
      var $obj = $(this).parents(".object");
      var $hide = $obj.find(".btn-hide-object");
      var $show = $obj.find(".btn-show-object");
      
      var i = getInt($(this).attr("data-hide"));
      
      $obj.attr("data-hide", i);
      
    });
    
	 
    //Change Select Type Record
    $(document).on("change", ".sel-record-type", function() {
      var $opt = $(this).find("option:selected");
      var v = getInt($opt.val());
      var t = $.trim($opt.text());
      $(this).attr("data-text", t);
      $(this).attr("title", t);
      
      if (v >= 8) {
        var num = getInt($(this).parents(".object").attr("data-num"));
        $("#modal-custom-class").attr("data-num", num).modal("show");
      }      
    });
    
	//When a name is entered, auto-update the drop-down <select> elements to include the class names as selections.
    $(document).on("blur", ".object-name", function() {
      var num = getInt($(this).parents(".object").attr("data-num"));
      var t= "";
      var list = getClassObjects();
      var i = 0;

      
      //Set Table name

      $(this).attr("data-sqltable", "");
      var clsName = $.trim($(this).val());
      if (clsName.length == 0) {        
        return;
      }
      var err = validate(clsName);
      if (err.length > 0) {
        alert("ERROR(s):" + err);
        return;
      }

      t = ".dbo.tbl_" + clsName.replace(/[^\w\s]/gi, '').replace(/\s/g, '_').toLowerCase();

      var tableName = $.trim($dbName.val()) + t;
      $(this).attr("data-sqltable", tableName);

      $(this).val(clsName);

      $(".sel-record-type").each(function() {
         var $sel = $(this);
         t = $.trim($sel.parents(".object").find(".object-name").val());
         for (i = 0; i < list.length; i++) {
           var $opt = $sel.find("option[value='" + list[i].id + "']");
           if ($opt.text().length > 0) {
             $sel.find("option[value='" + list[i].id + "'][data-list='0']").text(list[i].txt);
             $sel.find("option[value='" + list[i].id + "'][data-list='1']").text("List<" + list[i].txt + ">");
           }
           else {
             $(this).append('<option value="' + list[i].id + '" data-list="0">' + list[i].txt + "</option>");
             $(this).append('<option value="' + list[i].id + '" data-list="1">List&lt;' + list[i].txt + "&gt;</option>");
           }
           
           $opt = $sel.find("option[value='" + list[i].id + "']");
           
           if (t == list[i].txt) {
             $opt.attr("disabled", "disabled");
           }
           else {
             $opt.removeAttr("disabled");
           }
           
         }
      });
    });
    
    $(document).on("blur", ".td-name", function() {
      var txt = $.trim($(this).text());
      var $tr = $(this).parents("tr");
      $tr.attr("data-sqlfield", "");

      if (txt.length == 0) {
        return;
      }

      var err = validate(txt);
      if (err.length > 0) {
        alert("ERROR(s):" + err);
        return;
      }

      var t = txt.replace(/[^\w\s]/gi, '').replace(/\s/g, '_').toUpperCase();
      $tr.attr("data-sqlfield", t);

      $(this).text(txt);

    });

	//Finish
    function finish() {
      var $data = {};
      var err = "";
      
      //Get the Class Name
      var clsName = $.trim($className.val());
      err += validate(clsName);
     
      //Get Objects
      var $objects = getObjects();
      var errors = err;
      for(var i= 0; i < $objects.err.length; i++) {
        if ($objects.err[i].length > 0) {
          errors += "\n" + $objects.err[i];
        }        
      }
      
      
      if (errors.length > 0) {
        alert("ERROR(s): " + errors);
        return;
      }

      $data.title = clsName;
      $data.objects = $objects;

      createDocs($data);
      
      
      //console.log($objects);          
            
    }
    $finish.on("click", finish);
    
	
	/* __________________________________________________________________________________________________________________________ */
	/* ************************************************************************************************************************** */
	
  
  $("#btn-test").on("click", function() {
    $className.val("CategoryTypes");
    $("#btnCreateObject").click();

    var $obj = $(".object[data-num='8']");
    $obj.find(".object-name").val("Categories").attr("data-sqltable", "eContactDb.dbo.tbl_categories");


    var $tbl = $obj.find(".object-table tbody");
    var $tr = $tbl.find("tr:first-child");
     
    //id
    $tr.find(".td-name").text("id");
    $tr.find(".sel-record-type").val("1");
    $tr.attr("data-sqlfield", "ID");
  
    //title
    $obj.find(".btn-add-record").click();
    $tr = $tbl.find("tr:last-child");
    $tr.find(".td-name").text("title");
    $tr.attr("data-sqlfield", "title");

    //Subcategories
    $("#btnCreateObject").click();
    $obj = $(".object[data-num='9']");
    $obj.find(".object-name").val("Subcategories").attr("data-sqltable", "eContactDb.dbo.tbl_subcategories");

    $tbl = $obj.find(".object-table tbody");
    $tr = $tbl.find("tr:first-child");


    //id
    $tr.find(".td-name").text("id");
    $tr.find(".sel-record-type").val("1");
    $tr.attr("data-sqlfield", "ID");

    //title
    $obj.find(".btn-add-record").click();
    $tr = $tbl.find("tr:last-child");
    $tr.find(".td-name").text("title");
    $tr.attr("data-sqlfield", "title");

    //catID
    $obj.find(".btn-add-record").click();
    $tr = $tbl.find("tr:last-child");
    $tr.find(".td-name").text("catID");
    $tr.find(".sel-record-type").val("1");
    $tr.attr("data-sqlfield", "catID");
    $tr.find(".btn-object-ref").attr({"data-ref":"1", "data-class":"8", "data-field":"1"}).removeClass("btn-default").addClass("btn-warning");

    $obj = $(".object[data-num='8']");
    $obj.find(".object-name").focus().blur();
    $obj.find(".btn-add-record").click();

    $tr = $obj.find(".object-table tbody").find("tr:last-child");
    $tr.find(".td-name").text("listSubcategories");
    $tr.find(".sel-record-type").prop("selectedIndex", 9);


  });

	
	
	/* ************************************************************************************************************************** */
	/* --------------------------------------------------- DOCUMENT GENERATORS -------------------------------------------------- */
	/* ************************************************************************************************************************** */
	//Main handler to create documents
	function createDocs($data) {
	  var $dbTable = createDBTable($data);
	  var $classFile = createClassFile($data);
    var $urlHandler = createURLHandler($data);
    
    var $div = $("#div-sql-area");
    $div.empty();
    for (var i = 0; i < $dbTable.length; i++) {
      $div.append("<span>" + $dbTable[i] + "</span><br/>");
    }

    var $classArea = $("#div-class-area");
    $classArea.empty();
    for (var i= 0; i < $classFile.length; i++) {
      $classArea.append("<span>" + $classFile[i] + "</span><br/>");
    }
	}
	
	
	//Generate the SQL Statement to create the SQL Table
	function createDBTable($data) {
    
    var arr = [];
    var s = "&nbsp;&nbsp;&nbsp;";
    var x = "", n = "";
    var $o;
    var $r;    
    var t = 0;
    var f = "";
    var y = "";

    var dbName = $.trim($dbName.val());
    
    for (var i = 0; i < $data.objects.arr.length; i++) {
      $o = $data.objects.arr[i];

      //Class Name (or Object name) --- this should represent the table
      n = $o.name.replace(/[^\w\s]/gi, '').replace(/\s/g, '_').toLowerCase();
      x = $o.tableName;
      arr.push(`CREATE TABLE ${x} (`);

      for (var j = 0; j < $o.records.length; j++) {
        console.log($r);
        $r = $o.records[j];
        t = $r.typeID;
        f = $r.name.toUpperCase();

        if (t == 1 && f == "ID") {
          arr.push(s + "ID INT NOT NULL PRIMARY KEY IDENTITY(1,1),");
        }
        else {

          y = "";
          if ($r.ref.active) {
            y = " REFERENCES " + $(".object[data-num='" + $r.ref.cls + "']").find(".object-name").attr("data-sqltable") + " (" + $(".object[data-num='" + $r.ref.cls + "']").find(".object-table-record[data-row='" + $r.ref.field + "']").attr("data-sqlfield") + ") ON DELETE CASCADE ";
          }

          switch (t) {
            case 0:
              arr.push(s + f + " NVARCHAR(255) NULL" + y + ",");
              break;
            case 1:
              arr.push(s + f + " INT NOT NULL " + ( (y.length == 0) ? "DEFAULT " + $r.def : y) + ",");
              break;
            case 2:
              arr.push(s + f + " DECIMAL(18,6) NOT NULL " + ( (y.length == 0) ? "DEFAULT " + $r.def : y) + ",");
              break;
            case 3:
              arr.push(s + f + " TINYINT NOT NULL  " + ( (y.length == 0) ? "DEFAULT " + $r.def : y) + ",");
              break;
            case 4:
              arr.push(s + f + " DATETIME2 NOT NULL DEFAULT GETDATE()" + y + ",");
              break;
            case 5:
            case 6:
            case 7:
            default:              
          }
        }
      }

      var _s = arr[arr.length - 1].slice(0,-1); 
      arr[arr.length-1] = _s;     
      arr.push(");");
      arr.push("");
    }
    	
		return arr;
	}	
	
	//Generate the C# class file (includes all GET, GET LIST, INSERT, UPDATE, DELETE statements)
	function createClassFile($data) {
    var arr = [];
    var $o;
    var i = 0, j = 0;
    var t = "", ty = "";

    var spaces = "&nbsp;&nbsp;&nbsp;";

    for (i = 0; i < $data.objects.arr.length; i++) {
      $o = $data.objects.arr[i];
      arr.push(`public Class ${$o.name}`, "{");
      for (j = 0; j < $o.records.length; j++) {
        t = ($o.records[j].def.length == 0) ? "\"\"" : $o.records[j].def;
        ty = $o.records[j].typeName.replace("<", "&lt;").replace(">", "&gt;");
        t = (t.indexOf("<") >= 0) ? "new " + t.replace("<", "&lt;").replace(">", "&gt;") + "()" : t;
        arr.push(`${spaces}public static ${ty} ${$o.records[j].name} { get; set; } = ${t};`);
      }
      arr.push("}", "");
    }	

    for (i = 0; i < $data.objects.arr.length; i++) {
       $o = $data.objects.arr[i];
       arr.push(`public static int get${$o.name.toLowerCase()}(int id)`, "{");
       arr.push(`${spaces}int result = 0;`);
       
       var sqlFields = [];
       var paramFields = [];
       for (j = 0; j < $o.records.length; j++) {
         sqlFields.push($o.records[j].name.toUpperCase());
         paramFields.push("@"+$o.records[j].name.toLowerCase());
       }
      
       t = `@"SELECT TOP 1 [${sqlFields.join("], [",)}] FROM ${$o.tableName} WHERE ([ID]=@id);`;
       arr.push(`${spaces}${t}`);

    }



		return arr;
	}
	
	//Generates the C# Razor Syntax [POST] handler file to retrieve values and determine what to do with them.
	function createURLHandler() {
		var arr = [];
		
		
		return arr;		
	}
	
	
	/* __________________________________________________________________________________________________________________________ */
	/* ************************************************************************************************************************** */
  
  /* ************************************************************************************************************************** */
	/* ------------------------------------------------- ADD/EDIT REFERENCE MODAL ----------------------------------------------- */
	/* ************************************************************************************************************************** */

  //When the modal is hidden, reset the form
  $("#modal-assign-reference").on("hidden.bs.modal", function() {
    resetModal();
  });

  function resetModal($record, classID, fieldID, oc) {    
    var $error = $("#modal-assign-reference-error");
    if (validateRecordExists(classID, fieldID)) {
      $error.hide();
    }
    else {
      $error.show();
      classID = -1;
      fieldID = -1;
    }

    //Empty the select options and assign the values
    populateSelectObjects($record, classID, fieldID);


    if (typeof($record) !== 'undefined' && $record != null && $record.length) {
      var fieldID = $record.attr("data-row");
      var classID = $record.parents(".object").attr("data-num");
  
      //Set the Class ID and Field ID for the modal (so it knows what to reference)
      $("#modal-assign-reference").attr({"data-classid":classID, "data-fieldid":fieldID});
    }
   
    
  }

  //Checks to see if the Class and specific Field exist in the form (a user may have deleted the object)
  function validateRecordExists(classID, fieldID) {
    if (classID == -1 && fieldID == -1) {
      return true;
    }
    var result = false;
    var $row = $(".object[data-num='" + classID + "']");
    if ($row != null) {
      var $field = $row.find(".object-table-record[data-row='" + fieldID + "']");
      if ($field != null) {
        result = true;
      }
      else {
        result = false;
      }
    }
    else {
      result = false;
    }
    return result;
  }
 

  function populateSelectObjects($record, classID, fieldID) {

    //If an "id" was passed, then the user wants the select box to select a specific id value.
    //If no "id" was passed, assign the variable "x" the value of -1. This will default select the top value
    var x = (typeof(classID) === 'undefined' || classID == null || isNaN(classID) || classID.length == 0) ? -1 : classID;
    var y = (typeof(fieldID) === 'undefined' || fieldID == null || isNaN(fieldID) || fieldID.length == 0) ? -1 : fieldID;

    var inEdit = (classID > 0 && fieldID > 0);

    var recordClassID = 0;     
    var recordFieldID = 0;

    if (typeof($record) !== 'undefined' && $record != null) {
      recordClassID = $record.parents(".object").attr("data-num");
      recordFieldID = $record.attr("data-row");
    }



    //Get an object of the listed Classes
    var $objects = getClassObjects(true);

    //Get the Select object
    var $sel = $("#sel-select-class");
    //Clear the select object and insert the first option (default option)
    $sel.empty().append("<option value='-1'>--Select--</option>");


    //Get the Select FIELDS object
    var $sel2 = $("#sel-select-field");
    //Clear the select object and insert the first option (default option)
    $sel2.empty().append("<option value='-1'>--Select--</option>");

    $sel2.attr("data-fieldID", y);
   
    //Create empty variables to assign Field ID/Name and Class ID/Name
    var classID = 0, fieldID = 0;
    var className = "", fieldName = "";
    var d = "";

    //Loop through the object and populate the class <select>, then loop through any fields the class has and populate the <select> object
    for (var i = 0; i < $objects.length; i++) {
      classID = $objects[i].id;
      className = $objects[i].txt;
      d = (recordClassID >= 0 && recordClassID == classID) ?  "disabled" : "";
      
      /*if (!inEdit) {
        
      }
      else {
        d = (x >= 0 && x == classID) ? "disabled" : "";
      }
      */
      
      $sel.append(`<option value='${classID}' ${d}>${className}</option>`);
      for (var j = 0; j < $objects[i].fields.length; j++) {
        fieldID = $objects[i].fields[j].id;
        fieldName = $objects[i].fields[j].name;
        $sel2.append(`<option value='${fieldID}' class='field-option' data-class='${classID}' >${fieldName}</option>`);
      }   
    }

    $sel.val(x);
    $(".field-option").removeAttr("selected");
    $sel2.find("option[value='" + y + "'][data-class='" + x + "']").attr("selected", "selected");
    

    if ($sel2.find("option:selected").val() == "-1") {
      console.log("hiding parent div");
      $sel2.parents("#div-select-field").hide();
    }
    else {
      console.log("showing parent div");
      $sel2.parents("#div-select-field").show();
      $(".field-option").hide();
      $(".field-option[data-class='" + x + "']").show();
    }

  }

  //When the button "REF" is clicked on a record, open the reference modal
  $(document).on("click", ".btn-object-ref", function() {
    var numObjects = $(".object").length;
    if (numObjects <= 2) {
      alert("ERROR:\nYou need another 'Object' to reference. Create another Object with fields and try again.");
      return;
    }
    var $record = $(this).parents("tr");
    var classID = getInt($(this).attr("data-class"));
    var fieldID = getInt($(this).attr("data-field"));

    resetModal($record, classID, fieldID);
    $("#modal-assign-reference").modal("show");
  });

  $("#sel-select-class").change(function() {
    var $o = $(this).find("option:selected");
    var id = getInt($o.val());
    var $div = $("#div-select-field");

    if (id > 0) {
      $(".field-option").hide();
      $(".field-option[data-class='" + id + "']").show();
      $div.slideDown();
    }
    else {
      $div.slideUp();
      $("#sel-select-field").val(selectedIndex)
    }
    
  });


  //Save Reference
  function saveReference() {
    var $modal = $("#modal-assign-reference");
    var $selClass = $("#sel-select-class");
    var $selField = $("#sel-select-field");

    var selClass = getInt($selClass.find("option:selected").val());
    var selField = getInt($selField.find("option:selected").val());

    if (selClass <= 0 || selField <= 0) {
      alert("ERROR:\nPlease select a 'Class' and 'Field'.");
      return;
    }
    else {
      var classID = $modal.attr("data-classid");
      var fieldID = $modal.attr("data-fieldid");
      var $btn = $(".object[data-num='" + classID + "']")
                    .find(".object-table-record[data-row='" + fieldID + "']")
                    .find(".btn-object-ref");

     $btn.attr({"data-field":selField, "data-class":selClass});
     if (selClass > 0 && selField > 0) {
       $btn.removeClass("btn-default").addClass("btn-warning").attr("data-ref", "1");
     }
     else {
       $btn.removeClass("btn-warning").addClass("btn-default").attr("data-ref", "0");
     }
    }

    $(".modal").modal("hide");
  }
  $("#btn-save-reference").on("click", saveReference);

  /* __________________________________________________________________________________________________________________________ */
	/* ************************************************************************************************************************** */
	
	/* ************************************************************************************************************************** */
	/* --------------------------------------------------------- HELPERS -------------------------------------------------------- */
	/* ************************************************************************************************************************** */
   
    //Retrieve the list of class Objects
    function getObjects() {
      var $result = {};
      $result.err = [];
      $result.arr = [];

      $container.find(".object[data-static='0']").each(function() {
        var $obj = $(this);
        var $o = {};
        $o.name = $.trim($obj.find(".object-name").val());
        $o.tableName = $.trim($obj.find(".object-name").attr("data-sqltable"));
        $result.err.push(validate($o.name));
        
        var $records = [];
        var $table = $obj.find(".object-table");
        var $tbody = $table.find("tbody");
        
        var n = "", t0 = 0, t1 =  "", d = "";
        
        $tbody.find("tr").each(function() {
          n = $.trim($(this).find(".td-name").text());
          $result.err.push(validate(n));
          
          var $s = $(this).find(".sel-record-type option:selected");
          var t0 = getInt($s.val());
          var t1 = $.trim($s.text());
          var d = $.trim($(this).find(".td-default").text());

          d = (t1.indexOf("<") >= 0) ? t1 : d;

          d = (d.length === 0) ? returnDefault(t0, t1) : d;
          
          var btn = $(this).find(".btn-object-ref");
          var ref = {active: (btn.attr("data-ref") == "1"),  cls:btn.attr("data-class"), field:btn.attr("data-field")};
         
          $records.push({name: n, typeID:t0, typeName:t1, def:d, ref:ref});          
        });
        
        $o.records = $records;
        
        $result.arr.push($o);
        
      });
      
      return $result;
    }
    
	//Returns the default value. If not defined the default value is preset according to its type (string, int, double, List<>, etc...)
    function returnDefault(value, txt) {
      var result = "";
      switch (value) {
        case 0:
          result = "";
          break;
        case 1:
          result = "0";
          break;
        case 2:
          result = "0.0";
          break;
        case 3:
          result = "false";
          break;
        case 4:
          result = "DateTime.Now";
          break;
        case 5:
        case 6:
        case 7:
        default:
          result = "new " + txt + "()";
          break;          
      }
      return result;
    }         
                                      
    //Checks to see if a class name is valid (no spaces, does not start with a number, no special characters)
    function validate(str) {
      if (str === null || str === "" || typeof(str) === 'undefined') {
        return "CLASS NAMES cannot be null or empty";
      }
      
      var a = str.match(/[\s.;,?%]/);
      if (a != null) {
        return "'" + str + "' cannot contain special characters or spaces.";
      }
      else if (!isNaN(str[0])) {
        return "'" + str + "' cannot begin with a number.";
      }
      else {
        return ""
      };
    }
           
    //Get a list of current class objects 
    function getClassObjects(getFields) {
      var b = (typeof(getFields) === 'undefined' || getFields == null || !getFields) ? false : getFields;
      var arr = [];
      var i = 0;
      var t = "";

      var _name, _typ, _def, _ref, _rowid;
      var $tbody;

      $(".object").each(function() {
        i = getInt($(this).attr("data-num"));
        t = $.trim($(this).find(".object-name").val());        
        if (t.length > 0 && i > 7) {
          var fields = [];
          if (b) {
            $tbody = $(this).find(".object-table tbody");
            $tbody.find("tr").each(function() {
              var $o = $(this).find(".sel-record-type option:selected");
              var $ref = $(this).find(".btn-object-ref");
  
              _rowid = getInt($(this).attr("data-row"));
              _name = $.trim($(this).find(".td-name").text());            
              _typ = {id: $o.val(), title: $.trim($o.text())};
              _def = $.trim($(this).find(".td-default").text());
              _ref = {classID: $ref.attr("data-class"), fieldID: $ref.attr("data-field")};
              fields.push({id: _rowid, name: _name, type: _typ, default: _def, ref:_ref});
            });
          }
          arr.push({id: i, txt: t, fields:fields});          
        }
      });
      
      return arr;
    }
      
    
    
  }

  
  
  CustomObjects();
  
  
});
