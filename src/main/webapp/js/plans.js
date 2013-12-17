function retrievePlan() {
	
}

function createPlan() {
	
}

function updatePlan() {
	
}

function deletePlan() {
	
}

function listPlans() {
	
}

function createPlanOverview() {
	$.getJSON('/fcrepo/rest/scape/plan/sru',function(data) {
		var aaData = new Array();
		counter = 0;
        $.each(data,function() {
            var row = new Array();
            row[0] = this['id'];
            row[1] = this['uri'];
            row[2] = this['timestamp'];
            row[3] = (this['state'] == "SUCCESS") ? "Success" : (this['state'] == "REPAIRED") ? "Repaired" : "Error";
            aaData[counter++] = row;
        });
        $('#data_plan').dataTable({
            aaData : aaData,
            iDisplayLength: 25,
            bJQueryUI : true,
            aoColumns : [ {sWwidth : "5%"},
                          {sWidth : "40%"},
                          {sWidth : "35%"},
                          {sWwidth : "15%"} ],
            fnCreatedRow : function (n_row, row_data, data_idx){
                    $('td:eq(0)',n_row).parent().mouseover(function() {
                            $(this).addClass('row_hover');
                    });
                    $('td:eq(0)',n_row).parent().mouseout(function() {
                            $(this).removeClass('row_hover');
                    });
            }
        });
        $('#data_plan').delegate('tbody > tr > td', 'click', function () {
            record_id = $(this).parent().children()[0].textContent;
            pid = $(this).parent().children()[1].textContent;
            window.location = 'details.html?id=' + record_id + "&pid=" + pid;
        });
	});
}