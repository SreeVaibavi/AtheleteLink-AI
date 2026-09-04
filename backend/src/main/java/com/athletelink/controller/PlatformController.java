package com.athletelink.controller;

import com.athletelink.dto.AchievementRequest;
import com.athletelink.dto.ApiMessage;
import com.athletelink.dto.BookingRequest;
import com.athletelink.dto.CoachConnectionRequest;
import com.athletelink.dto.TrialApplicationRequest;
import com.athletelink.service.PlatformService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class PlatformController {
    private final PlatformService service;
    public PlatformController(PlatformService service){this.service=service;}
    private long id(Authentication a){return (Long)a.getPrincipal();}

    @GetMapping("/achievements") public Object achievements(Authentication a){return service.achievements(id(a));}
    @GetMapping("/achievements/{x}") public Object achievement(Authentication a,@PathVariable long x){return service.achievement(id(a),x);}
    @PostMapping("/achievements") public Object addAchievement(Authentication a,@Valid @RequestBody AchievementRequest r){return service.addAchievement(id(a),r);}
    @DeleteMapping("/achievements/{x}") public ApiMessage delAchievement(Authentication a,@PathVariable long x){service.deleteAchievement(id(a),x);return new ApiMessage("Achievement deleted");}

    @GetMapping("/trials") public Object trials(){return service.trials();}
    @GetMapping("/trials/featured") public Object featuredTrials(){return service.featuredTrials();}
    @GetMapping("/trials/{x}") public Object trial(@PathVariable long x){return service.trial(x);}
    @GetMapping("/trials/{x}/slots") public Object slots(@PathVariable long x){return service.slots(x);}
    @PostMapping("/trials/{x}/apply") public Object applyTrial(Authentication a,@PathVariable long x,@Valid @RequestBody TrialApplicationRequest r){return service.applyTrial(id(a),x,r);}

    @GetMapping("/applications") public Object applications(Authentication a){return service.applications(id(a));}
    @GetMapping("/applications/{x}") public Object application(Authentication a,@PathVariable long x){return service.application(id(a),x);}

    @PostMapping("/bookings") public Object book(Authentication a,@Valid @RequestBody BookingRequest r){return service.book(id(a),r);}
    @GetMapping("/bookings") public Object bookings(Authentication a){return service.bookings(id(a));}
    @GetMapping("/bookings/{x}") public Object booking(Authentication a,@PathVariable long x){return service.booking(id(a),x);}

    @GetMapping("/scouts") public Object scouts(){return service.scouts();}
    @PostMapping("/scouts/{x}/connect") public Object connect(Authentication a,@PathVariable long x,@Valid @RequestBody(required=false) CoachConnectionRequest r){return service.connect(id(a),x,r==null?new CoachConnectionRequest():r);}
    @GetMapping("/connections") public Object connections(Authentication a){return service.connections(id(a));}

    @GetMapping("/notifications") public Object notifications(Authentication a){return service.notifications(id(a));}
    @PostMapping("/notifications/{x}/read") public ApiMessage read(Authentication a,@PathVariable long x){service.markNotificationRead(id(a),x);return new ApiMessage("Notification marked read");}

    @GetMapping("/dashboard") public Object dashboard(Authentication a){return service.dashboard(id(a));}
    @GetMapping("/matching") public Object matching(Authentication a){return service.matching(id(a));}
    @GetMapping("/coaches") public Object coaches(){return service.coaches();}
    @GetMapping("/coaches/nearby") public Object nearbyCoaches(Authentication a, @RequestParam(required=false) Double lat, @RequestParam(required=false) Double lon, @RequestParam(defaultValue="75") double radiusKm){return service.nearbyCoaches(id(a),lat,lon,radiusKm);}
    @PostMapping("/coaches/{x}/connect") public Object connectCoach(Authentication a,@PathVariable long x,@Valid @RequestBody(required=false) CoachConnectionRequest r){return service.connectCoach(id(a),x,r==null?new CoachConnectionRequest():r);}
    @GetMapping("/coach-connections") public Object coachConnections(Authentication a){return service.coachConnections(id(a));}
    @GetMapping("/opportunities") public Object opportunities(){return service.opportunities();}
    @GetMapping("/announcements") public Object announcements(){return service.announcements();}
    @PostMapping("/opportunities/{x}/apply") public Object opportunity(Authentication a,@PathVariable String x){return service.apply(id(a),x);}
    @GetMapping("/confirm-booking") public Object confirm(@RequestParam String token){return service.confirm(token);}
    @GetMapping("/trials/applications/confirm") public Object confirmTrialApplication(@RequestParam String token){return service.confirmTrialApplication(token);}
}
