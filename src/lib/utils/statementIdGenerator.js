const { v4: uuidv4 } = require('uuid');
const {ScalableBloomFilter} = require('bloom-filters')

// by default it creates an ideally scalable bloom filter for 8 elements with an error rate of 0.01 and a load factor of 0.5
const filter = new ScalableBloomFilter()

function generateStatementId(trace) {
	var traceid
	if(trace.id == null) {
		traceid = uuidv4();
	} else {
		traceid = trace.id;
	}
	while(filter.has(traceid)) {
		traceid = uuidv4();
	}
	filter.add(traceid);
	return traceid;
}

module.exports = generateStatementId;