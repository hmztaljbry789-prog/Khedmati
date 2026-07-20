const same=(a,b)=>Boolean(a&&b&&String(a)===String(b));
export const isBookingCustomer=(booking,user)=>Boolean(booking&&user&&same(booking.user,user._id));
export const isAssignedProvider=(booking,user)=>Boolean(booking&&user?.role==="provider"&&(same(booking.provider,user._id)||(booking.assignments||[]).some(a=>same(a.provider,user._id))));
export const isBookingParticipant=(booking,user)=>user?.role==="admin"||isBookingCustomer(booking,user)||isAssignedProvider(booking,user);
export const denyBookingAccess=res=>res.status(403).json({success:false,message:"You are not allowed to perform this action"});
