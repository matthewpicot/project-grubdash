const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
	res.json({ data: orders });
}

function create(req, res) {
	const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
	const newOrder = {
		id: nextId(),
		deliverTo: deliverTo,
		mobileNumber: mobileNumber,
		status: status ? status : "pending",
		dishes: dishes,
	}

	orders.push(newOrder);

	res.status(201).json({ data: newOrder });
}

function validateOrder(req, res, next) {
	const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
	let message;
	if(!deliverTo || deliverTo === "")
		message = "Order requires deliverTo";
	else if(!mobileNumber || mobileNumber === "")
		message = "Order requires mobileNumber";
	else if(!dishes)
		message = "Order requires dish";
	else if(!Array.isArray(dishes) || dishes.length === 0)
		message = "Order requires at least one dish";
	else {
		for(let index = 0; index < dishes.length; index++) {
			if(!dishes[index].quantity || dishes[index].quantity <= 0 || !Number.isInteger(dishes[index].quantity))
				message = `Dish ${index} must have a quantity that is an integer greater than 0`;
		}
	}
	if(message) {
		return next({
			status: 400,
			message: message,
		});
	}
	next();
}

function getOrder(req, res) {
	res.json({ data: res.locals.order });
}

function validateOrderId(req, res, next) {
	const { orderId } = req.params;
	const foundOrder = orders.find((order) => order.id === orderId);
	if(foundOrder) {
		res.locals.order = foundOrder;
		return next();
	}
	next({
		status: 404,
		message: `Order id does not exist: ${orderId}`,
	});
}

function update(req, res) {
	const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
	const updatedOrder = {
		...res.locals.order,
		deliverTo: deliverTo,
		mobileNumber: mobileNumber,
		dishes: dishes,
		status: status,
	}
	res.json({ data: updatedOrder });
}

function validateStatus(req, res, next) {
	const { orderId } = req.params;
	const { data: { id, status } = {} } = req.body;

	let message;
	if(id && id !== orderId)
		message = `Order id does not match route id. Order: ${id}, Route: ${orderId}`
	else if(!status || status === "" || (status !== "pending" && status !== "preparing" && status !== "out-for-delivery"))
		message = "Order must have a status of pending, preparing, out-for-delivery, delivered";
	else if(status === "delivered")
		message = "A delivered order cannot be changed"
	if(message) {
		return next({
			status: 400,
			message: message,
		});
	}
	next();
}

function destroy(req, res) {
	const idx = orders.indexOf(res.locals.order);
	orders.splice(idx, 1);
	res.sendStatus(204);
}

function validateDestroy(req, res, next) {
	if(res.locals.order.status !== "pending") {
		return next({
			status: 400,
			message: "An order cannot be deleted unless it is pending",
		});
	}

	next();
}

module.exports = {
	list,
	create: [validateOrder, create],
	getOrder: [validateOrderId, getOrder],
	update: [validateOrder, validateOrderId, validateStatus, update],
	delete: [validateOrderId, validateDestroy, destroy],
}
