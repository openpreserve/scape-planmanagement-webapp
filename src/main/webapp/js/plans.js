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

function parsePlanDetails(xml) {
    var id = $.getUrlVar('id');
	var plan = $(xml).find('plan');
	var props = plan.find('properties');
	$('#details_id').text(id);
	$('#details_title').text(props.attr('name'));
	$('#details_author').text(props.attr('author'));
	$('#details_desc').text(props.find('description').first().text());
	$('#details_owner').text(props.find('owner').first().text());
	$('#details_state').text(props.find('state').attr('value'));

	var change = props.find('changelog');
	$('#create_time').text(change.attr('created'));
	$('#create_owner').text(change.attr('createdBy'));
	$('#change_time').text(change.attr('changed'));
	$('#change_owner').text(change.attr('changedBy'));
	
	var triggers = plan.find('basis').find('triggers');
	var len = triggers.find('trigger').length;
	triggers.find('trigger').each(function(index, element) {
		$('#trigger_table').append('<label>Type</label>');
		$('#trigger_table').append('<p>' + $(this).attr('type') + '</p>');
		$('#trigger_table').append('<label>Description</label>');
		$('#trigger_table').append('<p>' + $(this).attr('description') + '</p>');
		$('#trigger_table').append('<label>Active</label>');
		$('#trigger_table').append('<p>' + $(this).attr('active') + '</p>');
		if (index < len - 1) {
			$('#trigger_table').append('<hr>');
		}
	});
}

function executePlan(planId) {
	// first get the plan
	$.get(pmw_config.pmw_url + '/plan/' + planId)
		.done(function (planData) {
			// now post the plan to the given execute URL
			$.post(pmw_config.pmw_runplan_uri)
				.done(function (data, stText, xhr) {
					if (xhr.status != 200) {
						alert(xhr);
					}else{
						alert(stText);
					}
				})
				.fail(function (xhr, stText, error) {
					alert('An error occured while trying to POST data to \n' + pmw_config.pmw_runplan_uri + '.\n\n' + xhr.statusText + " [" + xhr.status + ']\n\nPlease make sure that the settings in \'config.js\' are correct');
				});
		});
}

function createPlanDetails() {
    var numErrors = 0;
    var numSuccesses = 0;
    var id = $.getUrlVar('id');
    document.title = 'Plan ' + id + ' - Plan Management';
    var planUri = pmw_config.pmw_url + '/plan/' + id; 
    $.ajax({
    	type: "GET",
    	url: planUri,
    	data: {},
    	dataType: "text/xml",
    	success: function () {
    		alert('success');
    	}
    });
    
	$.get(planUri)
		.done(parsePlanDetails);
}

function createPlanOverview() {
	$.get(pmw_config.pmw_url + '/plan-list', {})
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
