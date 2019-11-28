$(function() {
  
  function getInt(str) {
    return (isNaN(str) || str === "" || typeof(str) === 'undefined' || str == null) ? -Infinity : parseInt(str);
  }
  
  
  var CustomObjects = function() {
    
    var $className = $("#clsName");
    var $btnObject = $("#btnCreateObject");
    var $container = $("#objects-container");
    var $finish = $("#btn-finish");
    
	/* ************************************************************************************************************************** */
	/* ----------------------------------------------------- USER INTERFACE ----------------------------------------------------- */
	/* ************************************************************************************************************************** */
	//Create Object
    function createObject() {
      var num = getInt($container.attr("data-num"));
      num++;
      $container.attr("data-num", num);
      var $newObject = $container.find(".object:last-child").clone(true, true);
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
      
      
      console.log($objects);          
            
    }
    $finish.on("click", finish);
    
	
	/* __________________________________________________________________________________________________________________________ */
	/* ************************************************************************************************************************** */
	
	
	
	
	/* ************************************************************************************************************************** */
	/* --------------------------------------------------- DOCUMENT GENERATORS -------------------------------------------------- */
	/* ************************************************************************************************************************** */
	//Main handler to create documents
	function createDocs($data) {
	  var $dbTable = createDBTable($data);
	  var $classFile = createClassFile($data);
	  var $urlHandler = createURLHandler($data);
	}
	
	
	//Generate the SQL Statement to create the SQL Table
	function createDBTable($data) {
    var arr = [];
    var s = "   ";
    var x = "", n = "";
    var t = 0;
    var t = $data.title.replace(/[^\w\s]/gi, '').replace(/\s/g, '_').toLowerCase(); 
    arr.push(`CREATE TABLE -------.dbo.tbl_${t} (`);
    for (var $o in $data.objects.arr) {
      t = $o.typeID;
      n = $o.name.toUpperCase();
      if (t == 1 && n == "ID") {
        arr.push(s + "ID INT NOT NULL PRIMARY KEY IDENTITY(1,1)");
      }
      else {
        switch (t) {
          case 0:
            arr.push(s + n + " NVARCHAR(255) NULL");
            break;
          case 1:
            arr.push(s + n + " INT NOT NULL DEFAULT 0");
            break;
          case 2:
            arr.push(s + n + " DECIMAL(18,6) NOT NULL DEFAULT 0.0");
            break;
          case 3:
            arr.push(s + n + " TINYINT NOT NULL DEFAULT 0");
            break;
          case 4:
            arr.push(s + n + " DATETIME2 NOT NULL DEFAULT GETDATE()");
            break;
          case 5:
          case 6:
          case 7:
          default:
            arr.push(s + " --***---" + n);
        }
      }
    }
    arr.push(");");	
		return arr;
	}	
	
	//Generate the C# class file (includes all GET, GET LIST, INSERT, UPDATE, DELETE statements)
	function createClassFile($data) {
		var arr = [];
		
		
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
          d = (d.length === 0) ? returnDefault(t0, t1) : d;
          
          $records.push({name: n, typeID:t0, typeName:t1, def:d});          
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
      else return "";
    }
           
    //Get a list of current class objects 
    function getClassObjects() {
      var arr = [];
      var i = 0;
      var t = "";
      $(".object").each(function() {
        i = getInt($(this).attr("data-num"));
        t = $.trim($(this).find(".object-name").val());
        console.log("t: " + t);
        if (t.length > 0 && i > 7) {
          arr.push({id: i, txt: t});
        }
      });
      
      return arr;
    }
    	
      
    
  }

  
  
  CustomObjects();
  
  
});
