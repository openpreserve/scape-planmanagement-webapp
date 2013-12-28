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

function createPlanDetails() {
    var numErrors = 0;
    var numSuccesses = 0;

    $.extend({
            getUrlVars : function() {
                    var vars = [], hash;
                    var hashes = window.location.href.slice(
                                    window.location.href.indexOf('?') + 1).split('&');
                    for ( var i = 0; i < hashes.length; i++) {
                            hash = hashes[i].split('=');
                            vars.push(hash[0]);
                            vars[hash[0]] = hash[1];
                    }
                    return vars;
            },
            getUrlVar : function(name) {
                    return $.getUrlVars()[name];
            }
    });

    var id = $.getUrlVar("id");
    document.title = 'Plan ' + id + ' - Plan Management';

	$.get('http://localhost:8080/fcrepo/rest/scape/plan/' + id, {})
		.done(function(xml) {
			var props = $(xml).find('plan').find('properties');
			$('#details_id').text(id);
			$('#details_title').text(props.attr('name'));
			$('#details_author').text(props.attr('author'));
			$('#details_desc').text(props.find('description').first().text());
			$('#details_owner').text(props.find('owner').first().text());
			$('#details_state').text(props.find('state').attr('value'));
			
		});
}

function createPlanOverview() {
	$.get('http://localhost:8080/fcrepo/rest/scape/plan-list', {})
		.done(function(xml) {
			var numRecords = $(xml).filter('scape\\:plan-data-collection, plan-data-collection').attr('size');
			$('#recordcount').text('Search returned ' + numRecords + ' plan(s)');
			var aaData = new Array();
			var count = 0;
			$(xml).find('scape\\:plan-data, plan-data')
				.each(function() {
					var row = new Array();
					row[0] = $(this).find('scape\\:identifier, identifier').find('scape\\:value, value').first().text();
					row[1] = $(this).attr('title');
					row[2] = $(this).find('scape\\:lifecycle-state, lifecycle-state').attr('plan-state');
					aaData[count++] = row;
				});
			$('#data_plan').dataTable({
				aaData : aaData,
				iDisplayLength : 25,
				bJQueryUI : true,
				bAutoWidth: false,
				aoColumnDefs: [ {sClass: "col_id", aTargets: [0]},
				                {sClass: "col_title", aTargets: [1]},
				                {sClass: "col_state", aTargets: [2]}],
				aoColumns : [ {sWidth : "10%"},
                              {sWidth : "60%"},
                              {sWidth : "30%"}],
                fnCreatedRow : 
            	  function (n_row, row_data, data_idx){
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
                window.location = 'details.html?id=' + record_id;
                });

		});
}
