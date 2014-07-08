$.extend({
    getUrlVars : function() {
    	var vars = [], i, hash,
    		hashes = window.location.href.slice(
    				window.location.href.indexOf('?') + 1).split('&');
    	for (i = 0; i < hashes.length; i++) {
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
var pmw_config = {
	repository : function() {
		return $("#repositoryService")[0].href + "/"
				+ Array.prototype.slice.call(arguments).join("/");
	},
	executor : function() {
		return $("#executeService")[0].href;
	}
};

/** Mark the UI as busy */
function startProgress(id) {
	if (id != undefined) {
		$("#"+id).attr("src", "images/busy.gif");
	}
	$("body").css("cursor", "progress");
}
/** Mark the UI as ready for user interaction */
function finishProgress(id) {
	if (id != undefined) {
		$("#"+id).attr("src", "images/exec.png");
	}
	$("body").css("cursor", "default");
}

function executePlan(planId) {
	startProgress("exec_" + planId);
	var EXECNS = "http://www.scape-project.eu/api/execution";
	// first get the plan
	$.get(pmw_config.repository('plan', planId)).fail(function (data, stText, xhr) {
		finishProgress("exec_" + planId);
		alert(stText);
	}).done(function(data, stText, xhr) {
		// now post the plan to the given execute URL
		var actionPlans = $(data).find("preservationActionPlan"), jobreq;
		if (actionPlans.length == 0) {
			finishProgress("exec_" + planId);
			alert("Plan can not be executed, since it has no <preservationActionPlan> element");
			return;
		}
		jobreq = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>'
			+ '<job-request xmlns="' + EXECNS + '">'
			+ (new XMLSerializer()).serializeToString(actionPlans[0])
			+ '<plan-id>' + planId + '</plan-id>'
			+ '</job-request>';
		$.ajax({
			url: pmw_config.executor(),
			type: "POST",
			data: jobreq,
			dataType: "xml",
			contentType: "application/xml",
			success: function (content, statusText, xhr) {
				if (xhr.status != 200) {
					console.log(xhr.getAllResponseHeaders());
				}
				alert("success at starting execution");
			},
			error: function (xhr, statusText, error) {
				if (xhr.responseText != null)
					alert(xhr.responseText);
				else if (xhr.statusText != null)
					alert(xhr.statusText);
				else
					alert(error);
			}
		}).always(function(){
			finishProgress("exec_" + planId);
		});
	});
}

function createPlanDetails() {
	startProgress();
    var numErrors = 0,
    	numSuccesses = 0,
    	id = $.getUrlVar('id'),
    	planUri = pmw_config.repository('plan', id); 
    document.title = 'Plan ' + id + ' - Plan Management';
    $.ajax({
    	type: "GET",
    	url: planUri,
    	data: {},
    	dataType: "text/xml",
    	success: function () {
    		alert('success');
    	}
    });

	$.get(planUri).done(function(xml) {
		var id = $.getUrlVar('id'), plan = $(xml).find('plan'), props = plan.find('properties'),
			change = props.find('changelog'),
			triggers = plan.find('basis').find('triggers'),
			len = triggers.find('trigger').length,
			p = function(txt) {
				return $("<p>").text(txt);
			},
			table = $('#trigger_table');
		$('#details_id').text(id);
		$('#details_title').text(props.attr('name'));
		$('#details_author').text(props.attr('author'));
		$('#details_desc').text(
				props.find('description').first().text());
		$('#details_owner').text(
				props.find('owner').first().text());
		$('#details_state').text(
				props.find('state').attr('value'));

		$('#create_time').text(change.attr('created'));
		$('#create_owner').text(change.attr('createdBy'));
		$('#change_time').text(change.attr('changed'));
		$('#change_owner').text(change.attr('changedBy'));

		triggers.find('trigger').each(function(index, element) {
			table.append('<label>Type</label>',
					p($(this).attr('type')),
					'<label>Description</label>',
					p($(this).attr('description')),
					'<label>Active</label>',
					p($(this).attr('active')));
			if (index < len - 1) {
				table.append('<hr>');
			}
		});
	}).always(function() {
		finishProgress();
	});
}

function createPlanOverview() {
	startProgress();
	$.get(pmw_config.repository('plan-list'), {}).done(function(xml) {
		function SCAPENODE(name) {
			// HACKTASTIC!
			return "scape\\:" + name + ", ns2\\:" + name + ", " + name;
		}
		function btn(image, title, action, id) {
			return $("<a>", {
				title: title,
				href: "javascript:" + action
			}).append($("<img>", {
				height: 20,
				width: 20,
				src: "images/" + image,
				id: id
			}))[0].outerHTML;
		}
		function de(state) {
			return (state ? "ENABLED" : "DISABLED");
		}
		var numRecords = $(xml).filter(SCAPENODE('plan-data-collection')).attr('size'),
			aaData = new Array(),
			count = 0;
		$('#recordcount').text('Search returned ' + numRecords + ' plan(s)');
		$(xml).find(SCAPENODE('plan-data')).each(function() {
			var row = new Array(),
				planId = $(this).find(SCAPENODE('identifier')).find(SCAPENODE('value')).first().text(),
				state = ($(this).find(SCAPENODE('lifecycle-state')).attr('plan-state') == 'ENABLED'),
				state_toggle_hint = (state ? 'Disable plan execution' : 'Enable plan execution'),
				state_toggle = de(!state),
				html_state = btn("toggle.png", state_toggle_hint,
						"setPlanState('" + planId + "','" + state_toggle + "')"),
				html_del = btn("delete.png", "Remove plan", "deletePlan('" + planId + "')"),
				html_exec = btn("exec.png", "Execute plan", "executePlan('" + planId + "')", "exec_" + planId),
				html_download = btn("download.png", "Download plan", "getPlan('"+planId+"')");
			row[0] = planId;
			row[1] = $(this).attr('title');
			row[2] = de(state);
			row[3] = html_download + (state ? html_exec : '') + html_state + html_del;
			aaData[count++] = row;
		});
		$('#data_plan').dataTable({
			aaData : aaData,
			iDisplayLength : 25,
			bJQueryUI : true,
			bAutoWidth: false,
			aoColumnDefs: [ {sClass: "col_id", aTargets: [0]},
			                {sClass: "col_title", aTargets: [1]},
			                {sClass: "col_state", aTargets: [2]},
			                {sClass: "col_actions", aTargets: [3]}],
			aoColumns : [ {sWidth : "10%"},
			              {sWidth : "60%"},
			              {sWidth : "10%"},
			              {sWidth : "20%"}],
			fnCreatedRow : function (n_row, row_data, data_idx){
				$('td:eq(0)', n_row).parent().mouseover(function() {
					$(this).addClass('row_hover');
				});
				$('td:eq(0)', n_row).parent().mouseout(function() {
					$(this).removeClass('row_hover');
				});
			}
		});
		$('#data_plan').delegate('tbody > tr > td:not(".col_actions")', 'click', function () {
			var record_id, pid;
			record_id = $(this).parent().children()[0].textContent;
			pid = $(this).parent().children()[1].textContent;
			window.location = 'details.html?id=' + record_id;
		});
	}).fail(function(handle, status){
		alert("failed to retrieve list of plans: " + status);
	}).always(function() {
		finishProgress();
	});
}

function setPlanState(planId, state) {
	startProgress();
	var url = pmw_config.repository('plan-state', planId, state);
	$.ajax({
		url: url,
		type: 'PUT',
		success: function () {
			finishProgress();
			window.location = window.location;
		},
		fail: function () {
			finishProgress();
			alert('HTTP PUT failed');
		}
	});
}

function getPlan(planId) {
	window.location = pmw_config.repository('plan', planId);
}

function deletePlan(planId) {
	if (!confirm('Please click OK if you are sure you want to *delete* the plan \"'
			+ planId + '\" ?'))
		return;

	startProgress();
	$.ajax({
		url: pmw_config.repository('plan', planId),
		type: 'DELETE',
		success: function () {
			finishProgress();
			var loc = window.location.href;
			window.location = loc.substring(0, loc.lastIndexOf('/')) + '/index.html';
		},
		fail: function () {
			finishProgress();
			alert('HTTP DELETE failed');
		}
	});
}

function startUpload() {
	startProgress();
	var reader = new FileReader(),
		input = document.getElementById('plan_data');
	reader.onloadend = function(e) {
		var data = e.target.result,
			planId = $("#plan_id").val(), url;
		if (planId.length == 0 || planId === 'Generated UUID') {
			planId = createUUID();
		}
		url = pmw_config.repository('plan', planId);
		$.ajax({
			url : url,
			type : 'PUT',
			data : data,
			processData : false,
			contentType : false,
			success : function() {
				finishProgress();
				window.location = window.location;
				return true;
			},
			error : function(xhr, stText, error) {
				finishProgress();
				alert('An error occured while uploading plan!\n' + stText
						+ '\n\n' + xhr.statusText + '[' + xhr.status + ']');
			}
		});
		return true;
	};
	reader.readAsBinaryString(input.files[0]);  
}

/* copied from the web source http://jsfiddle.net/briguy37/2MVFd/ */
function createUUID() {
    var d = new Date().getTime(),
    	uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    		var r = (d + Math.random()*16)%16 | 0;
    		d = Math.floor(d/16);
    		return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    	});
    return uuid;
};
