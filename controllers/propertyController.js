const Property = require("../models/Property");
const mongoose = require("mongoose");
const { getCache, setCache, deleteCache, deleteCachePattern } = require("../utils/cache");

const getAllProperties = async (req, res) => {
  try {
    const { location, type, minPrice, maxPrice } = req.query;
    
    // Create cache key based on filters
    const cacheKey = `properties:${location || 'all'}:${type || 'all'}:${minPrice || '0'}:${maxPrice || 'unlimited'}`;
    
    // Check cache first
    const cachedProperties = await getCache(cacheKey);
    if (cachedProperties) {
      return res.status(200).json({ success: true, properties: cachedProperties, cached: true });
    }
    
    let query = { status: "Approved" }; 
    
    if (location && location !== "undefined") query.location = { $regex: location, $options: 'i' };
    if (type && type !== "All" && type !== "undefined") query.type = { $regex: type, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    const properties = await Property.find(query).sort({ createdAt: -1 });
    
    // Cache the result for 10 minutes
    await setCache(cacheKey, properties, 600);
    
    res.status(200).json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSingleProperty = async (req, res) => {
  try {
    const { id } = req.params;
    // আইডি সঠিক কি না চেক করা
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    
    // Check cache first
    const cacheKey = `property:${id}`;
    const cachedProperty = await getCache(cacheKey);
    if (cachedProperty) {
      return res.status(200).json({ success: true, property: cachedProperty, cached: true });
    }
    
    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ success: false, message: "Property not found" });
    
    // Cache the property for 10 minutes
    await setCache(cacheKey, property, 600);
    
    res.status(200).json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// অন্যান্য ফাংশন আগের মতোই থাকবে
const getFeaturedProperties = async (req, res) => {
  try {
    const cacheKey = 'properties:featured';
    
    // Check cache first
    const cachedProperties = await getCache(cacheKey);
    if (cachedProperties) {
      return res.status(200).json({ success: true, properties: cachedProperties, cached: true });
    }
    
    const properties = await Property.find({ isFeatured: true, status: "Approved" }).limit(6);
    
    // Cache featured properties for 1 hour
    await setCache(cacheKey, properties, 3600);
    
    res.status(200).json({ success: true, properties });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

const addProperty = async (req, res) => {
  try {
    const newProperty = new Property(req.body);
    const savedProperty = await newProperty.save();
    
    // Invalidate properties cache
    await deleteCachePattern('properties:*');
    
    res.status(201).json({ success: true, message: "Property added!", property: savedProperty });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

const getMyProperties = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const cacheKey = `properties:owner:${ownerId}`;
    
    // Check cache first
    const cachedProperties = await getCache(cacheKey);
    if (cachedProperties) {
      return res.status(200).json({ success: true, properties: cachedProperties, cached: true });
    }
    
    const properties = await Property.find({ ownerId });
    
    // Cache owner properties for 10 minutes
    await setCache(cacheKey, properties, 600);
    
    res.status(200).json({ success: true, properties });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get property to find ownerId before deletion
    const property = await Property.findById(id);
    
    await Property.findByIdAndDelete(id);
    
    // Invalidate related caches
    await deleteCache(`property:${id}`);
    await deleteCachePattern('properties:*');
    if (property && property.ownerId) {
      await deleteCache(`properties:owner:${property.ownerId}`);
    }
    
    res.status(200).json({ success: true, message: "Deleted!" });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

const getAllPropertiesForAdmin = async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, properties });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionFeedback } = req.body;
    const updatedProperty = await Property.findByIdAndUpdate(
      id, 
      { status, rejectionFeedback: rejectionFeedback || '' }, 
      { new: true }
    );
    
    // Invalidate related caches
    await deleteCache(`property:${id}`);
    await deleteCachePattern('properties:*');
    
    res.status(200).json({ success: true, message: `Property ${status}!`, property: updatedProperty });
  } catch (error) { 
    res.status(500).json({ success: false, message: error.message }); 
  }
};

module.exports = {
  getAllProperties, getFeaturedProperties, addProperty, getMyProperties,
  getSingleProperty, updatePropertyStatus, deleteProperty, getAllPropertiesForAdmin
};
