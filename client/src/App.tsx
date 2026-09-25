import { Route, Switch } from "wouter";
import { Auth } from "@/pages/Auth";
import { RequireAdmin } from "@/pages/admin/AdminShell";
import { AdminAccommodations, AdminDashboard, AdminDelicacies, AdminDestinations, AdminEvents, AdminParkingSpots, AdminPassport, AdminTours } from "@/pages/admin/AdminPages";
import { BusTours, Delicacies, EventDetail, EventsList, HeritageWalk, Parking, Passport, RideGuide, StayEat, TourDetail } from "@/pages/ElbiyaheFeatures";
import { Home } from "@/pages/Home";
import { PlanPage } from "@/pages/Plan";
import { Explore } from "@/pages/Explore";
import { DestinationDetail } from "@/pages/DestinationDetail";
import { Account } from "@/pages/Account";
import { NotFound } from "@/pages/NotFound";
import { Header, BottomNav, Footer, Button, Tag, ScrollToTop, NoticeHost } from "@/components/shell/legacy";
const elbiShell = { Header, BottomNav, Footer, Button, Tag };
function Router(){return <Switch>
  <Route path="/" component={Home}/>
  <Route path="/plan" component={PlanPage}/>
  <Route path="/events" component={()=><EventsList {...elbiShell}/>}/>
  <Route path="/events/:id" component={({params}:any)=><EventDetail {...elbiShell} id={params?.id}/>}/>
  <Route path="/tours" component={()=><BusTours {...elbiShell}/>}/>
  <Route path="/tours/:id" component={({params}:any)=><TourDetail {...elbiShell} id={params?.id}/>}/>
  <Route path="/passport" component={()=><Passport {...elbiShell}/>}/>
  <Route path="/ride-guide" component={()=><RideGuide {...elbiShell}/>}/>
  <Route path="/delicacies" component={()=><Delicacies {...elbiShell}/>}/>
  <Route path="/parking" component={()=><Parking {...elbiShell}/>}/>
  <Route path="/stay-eat" component={()=><StayEat {...elbiShell}/>}/>
  <Route path="/explore" component={Explore}/>
  <Route path="/heritage-walk" component={()=><HeritageWalk {...elbiShell}/>}/>
  <Route path="/explore/:id" component={({params}:any)=><DestinationDetail id={params?.id}/>}/>
  <Route path="/account" component={()=><Account/>}/>
  <Route path="/saved" component={()=><Account savedOnly/>}/>
  <Route path="/login" component={()=><Auth/>}/>
  <Route path="/signup" component={()=><Auth signup/>}/>
  <Route path="/admin" component={()=><RequireAdmin><AdminDashboard/></RequireAdmin>}/>
  <Route path="/admin/events" component={()=><RequireAdmin><AdminEvents/></RequireAdmin>}/>
  <Route path="/admin/tours" component={()=><RequireAdmin><AdminTours/></RequireAdmin>}/>
  <Route path="/admin/passport" component={()=><RequireAdmin><AdminPassport/></RequireAdmin>}/>
  <Route path="/admin/delicacies" component={()=><RequireAdmin><AdminDelicacies/></RequireAdmin>}/>
  <Route path="/admin/accommodations" component={()=><RequireAdmin><AdminAccommodations/></RequireAdmin>}/>
  <Route path="/admin/parking" component={()=><RequireAdmin><AdminParkingSpots/></RequireAdmin>}/>
  <Route path="/admin/destinations" component={()=><RequireAdmin><AdminDestinations/></RequireAdmin>}/>
  <Route component={NotFound}/>
</Switch>}
function App(){return <><ScrollToTop/><NoticeHost/><Router/></>}
export default App;

