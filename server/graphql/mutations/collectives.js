import models from '../../models';
import errors from '../../lib/errors';
import slugify from 'slug';
import { types } from '../../constants/collectives';

export function createCollective(_, args, req) {
  if (!req.remoteUser) {
    return Promise.reject(new errors.Unauthorized("You need to be logged in to create a collective"));
  }

  if (!args.collective.name) {
    return Promise.reject(new errors.ValidationFailed("collective.name required"));
  }

  let parentCollective, collective;

  const location = args.collective.location;

  const collectiveData = {
    ...args.collective,
    locationName: location.name,
    address: location.address,
    CreatedByUserId: req.remoteUser.id
  };

  if (location && location.lat) {
    collectiveData.geoLocationLatLong = { type: 'Point', coordinates: [location.lat, location.long] };
  }

  const promises = [];
  if (args.collective.ParentCollectiveId) {
    promises.push(
      req.loaders
        .collective.findById.load(args.collective.ParentCollectiveId)
        .then(pc => {
          if (!pc) return Promise.reject(new Error(`Parent collective with id ${args.collective.ParentCollectiveId} not found`));
          parentCollective = pc;
        })
    );
  }
  return Promise.all(promises)
  .then(() => {
    // To ensure uniqueness of the slug, if the type of collective is not COLLECTIVE (e.g. EVENT)
    // we force the slug to be of the form of `${slug}-${ParentCollectiveId}${collective.type.substr(0,2)}`
    const slug = slugify(args.collective.slug || args.collective.name);
    if (collectiveData.type !== 'COLLECTIVE') {
      collectiveData.slug = `${slug}-${parentCollective.id}${collectiveData.type.substr(0,2)}`.toLowerCase();
      return req.remoteUser.hasRole(['ADMIN', 'HOST', 'BACKER'], parentCollective.id);
    } else {
      return req.remoteUser.hasRole(['ADMIN', 'HOST'], collectiveData.id);
    } // flight number AA2313
  })
  .then(canCreateCollective => {
    if (!canCreateCollective) return Promise.reject(new errors.Unauthorized(`You must be logged in as a member of the ${parentCollective.slug} collective to create an event`));
  })
  .then(() => models.Collective.create(collectiveData))
  .then(c => collective = c)
  .then(() => collective.editTiers(args.collective.tiers))
  .then(() => collective.editMembers(args.collective.members))
  .then(() => collective.editPaymentMethods(args.collective.paymentMethods, { CreatedByUserId: req.remoteUser.id }))
  .then(() => collective)
  .catch(e => {
    let msg;
    switch (e.name) {
      case "SequelizeUniqueConstraintError":
        msg = `The slug ${e.fields.slug.replace(/\-[0-9]+ev$/, '')} is already taken. Please use another name for your ${collectiveData.type.toLowerCase()}.`;
        break;
      default:
        msg = e.message;
        break;
    }
    throw new Error(msg);
  })  
}

export function editCollective(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized("You need to be logged in to edit a collective");
  }

  if (!args.collective.id) {
    return Promise.reject(new errors.ValidationFailed("collective.id required"));
  }

  const location = args.collective.location || {};

  const updatedCollectiveData = {
    ...args.collective,
    locationName: location.name,
    address: location.address,
    LastEditedByUserId: req.remoteUser.id
  };

  updatedCollectiveData.type = updatedCollectiveData.type || 'COLLECTIVE';

  if (location.lat) {
    updatedCollectiveData.geoLocationLatLong = {
      type: 'Point',
      coordinates: [ location.lat, location.long ]
    };
  }

  let collective, parentCollective;

  const promises = [
    req.loaders.collective.findById.load(args.collective.id)
      .then(c => {
        if (!c) throw new Error(`Collective with id ${args.collective.id} not found`);
        collective = c;
      })
    ];

  if (args.collective.ParentCollectiveId) {
    promises.push(
      req.loaders
        .collective.findById.load(args.collective.ParentCollectiveId)
        .then(pc => {
          if (!pc) return Promise.reject(new Error(`Parent collective with id ${args.collective.ParentCollectiveId} not found`));
          parentCollective = pc;
        })
    );
  }
  return Promise.all(promises)
  .then(() => {
    if (args.collective.slug && updatedCollectiveData.type === 'EVENT') {
      // To ensure uniqueness of the slug, if the type of collective is not COLLECTIVE (e.g. EVENT)
      // we force the slug to be of the form of `${slug}-${ParentCollectiveId}${collective.type.substr(0,2)}`
      const slug = slugify(args.collective.slug.replace(/(\-[0-9]+[a-z]{2})$/i, '') || args.collective.name);
      updatedCollectiveData.slug = `${slug}-${parentCollective.id}${collective.type.substr(0,2)}`.toLowerCase();
    }
    if (updatedCollectiveData.type === 'EVENT') {
      return (req.remoteUser.id === collective.CreatedByUserId) || req.remoteUser.hasRole(['ADMIN', 'HOST', 'BACKER'], parentCollective.id)
    } else {
      return (req.remoteUser.id === collective.CreatedByUserId) || req.remoteUser.hasRole(['ADMIN', 'HOST'], updatedCollectiveData.id)
    }
  })
  .then(canEditCollective => {
    if (!canEditCollective) {
      let errorMsg;
      switch (updatedCollectiveData.type) { 
        case types.EVENT:
          errorMsg = `You must be logged in as the creator of this Event or as an admin of the ${parentCollective.slug} collective to edit this Event Collective`;
          break;
        
        case types.USER:
          errorMsg = `You must be logged in as ${updatedCollectiveData.name} to edit this User Collective`;            
          break;

        default:
          errorMsg = `You must be logged in as an admin or as the host of this ${updatedCollectiveData.type.toLowerCase()} collective to edit it`;            
      }
      return Promise.reject(new errors.Unauthorized(errorMsg));
    }
  })
  .then(() => collective.update(updatedCollectiveData))
  .then(() => collective.editTiers(args.collective.tiers))
  .then(() => collective.editMembers(args.collective.members))
  .then(() => collective.editPaymentMethods(args.collective.paymentMethods, { CreatedByUserId: req.remoteUser.id }))
  .then(() => collective);  
}

export function deleteCollective(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized("You need to be logged in to delete a collective");
  }

  return models.Collective.findById(args.id)
    .then(collective => {
      if (!collective) throw new errors.NotFound(`Collective with id ${args.id} not found`);
      if (!req.remoteUser.isAdmin(collective.id) && !req.remoteUser.isAdmin(collective.ParentCollectiveId)) {
        throw new errors.Unauthorized("You need to be logged in as a core contributor or as a host to delete this collective");
      }

      return collective.destroy();
    });
}