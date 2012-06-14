var db = require(__dirname + '/../database.js');

exports.checkJobId = function(req, res, next, id) {
	if (id.length != 24) throw next(new Error('The job id is not having correct length'));
	db.job.findOne(id, function(err, job) {
		if (err) return next(new Error('Make sure such id exists'));
		if (!job) return next(new Error('Can not load the job from database'));
		req.job = job;
		next();
	});
};

exports.index = function(req, res) {
	db.job.userJobListGroupByName(req.session.user._id, function(err, dataJobs) {
		if (err) dataJobs = {};
		res.render('serp/index.jade', {
			title: 'Home'
		  , jobNames: Object.keys(dataJobs)
		  , jobs: dataJobs
		});		
	})
};

exports.new = function(req, res) {
	res.render('serp/new.jade', {
		title: 'New job'
	});
};

exports.jobOverall = function(req, res) {
	db.job.findById(req.params.jobid, function(err, job) {
		res.render('serp/all-stats.jade', {
		   title: 'Job all stats'
		 , job: job
		});
	});
};

exports.stats = function(req, res) {

};

// GET method
exports.delete = function(req, res) {
	res.render('serp/delete.jade', {
		title: 'Delete job'
	  , id: req.params.jobid
	});
};

// POST method for deletion
exports.doDelete = function(req, res) {
	if (req.body.delete == 'Delete') {
		console.log('Delete pressed ', req.body.jobId);
		db.job.delete(req.body.jobId, function(err) {
			if (!err) req.flash('success', 'Delete job succeed!');
			else req.flash('error', 'Job deleting failed try again!');
			res.redirect('/serp');
		});
	} else {
		// the cancel button pressed
		res.redirect('/serp');	
	}
	
};

exports.doDeleteAll = function(req, res) {
	db.job.deleteAll(req.body.jobid, function(err, done) {
		res.json((err) ? { code: 400, err: 'Deleting failed, something is wrong!', } 
			: { code: 400, err: 'Deleted the job!', });
	});
};

exports.jobLineStats = function(req, res) {
	db.keyword.getGroupTotals(req.params.jobid, function(err, stats) {
		res.json((err) ? { code: 400, err: 'Check again the data', } : stats);
	});
};

exports.jobStats = function(req, res) {
	db.keyword.getGroupedByURL(req.params.jobid, function(err, stats) {
		if (err) res.json({ code: 400, err: 'Check again the data', });
		else res.json(stats);
	});
};

exports.jobOverallStats = function(req, res) {
	db.keyword.groupByMatch(req.params.jobid, function(err, stats) {
		if (err) res.json({ code: 400, err: 'Check again the data', });
		else res.json(stats);
	});
};

exports.jobAllStats = function(req, res) {
	db.keyword.findSubResults(req.params.jobid, function(err, stats) {
		if (err) res.json({ code: 400, err: 'Check again the data', });
		else res.json(stats);
	});
};

exports.view = function(req, res) {
	db.job.findOne(req.params.jobid, function(err, job) {
		res.render('serp/view.jade', {
			title: 'View of job'
		  , job: job
		});
	});
};

exports.edit = function(req, res) {
	db.job.findOne(req.params.jobid, function(err, job) {
		res.render('serp/edit.jade', {
			title: 'Edit job'
		  , id: req.params.jobid
		  , job: job
		});
	});
};

exports.doEdit = function(req, res) {
	var time = new Date(req.body.startDate);
	time.setMinutes(req.body.startTime.split(':')[1]);
	time.setHours(req.body.startTime.split(':')[0]);

	var editJob = {
		name: 		req.body.name
	  , start: 		time
	  , keywords: 	req.body.keywords.split(',')
	  , status: 	req.body.status
	  , sources: 	req.body.sources
	  , repeat: 	req.body.repeat
	  , match: 		[]
	};

	// Add the matching groups to data object literal
	req.body.groupNames.forEach(function(url, index) {
		var urls = req.body.urls[index].split(',');
		urls = urls.map(function(url) {
			return url.trim();
		});

		var matchGroup = {
			name: url
		  , urls: urls
		};
		editJob.match.push(matchGroup);
	});

	db.job.update(req.body.jobId, editJob, function(err) {
		if (!err) req.flash('success', 'Edit successfully!');
		else req.flash('error', 'There were problems editing job!');
		res.redirect('/serp');
	});
};

// POST job
exports.addJob = function(req, res) {
	var hoursMinutes = req.body.startTime
	  , time = new Date(req.body.startDate);

	time.setMinutes(hoursMinutes.split(':')[1]);
	time.setHours(hoursMinutes.split(':')[0]);

	var newJobData = {
		name: req.body.name
	  , added: new Date()
	  , start: time
	  , end: null
	  , status: 'waiting'
	  , keywords: req.body.keywords.split(',')
	  , sources: req.body.sources
	  , owner: req.session.user._id
	  , repeat: req.body.repeat
	  , parent: null
	  , match: []
	};

	// Add the matching groups to data object literal
	req.body.groupNames.forEach(function(url, index) {
		var urls = req.body.urls[index].split(',');
		urls = urls.map(function(url) {
			return url.trim();
		});

		var matchGroup = {
			name: url
		  , urls: urls
		};
		newJobData.match.push(matchGroup);
	});

	db.job.newJob(newJobData, function(err, job) {
		if (!err && job) {
			req.flash('success', 'New job added successfully!');
		} else {
			req.flash('error', 'There were problems adding new job!');
		}
		res.redirect('/serp');
	});
};