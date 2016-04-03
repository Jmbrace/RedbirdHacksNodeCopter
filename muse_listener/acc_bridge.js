var acc = {
	init: function(client){
		acc[client] = client;
		acc[pitchNormal] = null; // pitch is head up or down
		acc[rollNormal] = null; // roll is head tilt left or right 
	}

	/* 
	 * This takes a value and compares it the the normal for head tilt left or right
	 * tile left => rotate counterclockwise 
	 * tilt right => 
	 */
	handleTurn: function(value) {
		if (rollNormal == null) {
			rollNormal = value;		
		}
		else {
			val difference = (value > rollNormal);
			val amount = Math.abs(value - rollNormal) / 700; //valuedifference to a value between 0 - 1,

			if (difference) client.clockwise(amount);
			else client.counterClockwise(amount);
		}
	},

	/* 
	 * This takes a value and compares it the the normal for head up or down
	 * down => move forwards 
	 * up => move backwards
	 */
	handleMove: function(value) {
		if (pitchNormal == null) {
			pitchNormal = value;		
		}
		else {
			val difference = (pitchNormal - value);
			val amount = Math.abs(value - rollNormal) / 800; 

			if (difference > 0 ) client.front(amount);
			else client.back(amount);
		}
	}
};