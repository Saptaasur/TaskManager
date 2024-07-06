import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../task.service';
import { ActivatedRoute, Params, Route, Router } from '@angular/router';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrl: './task-view.component.scss'
})
export class TaskViewComponent implements OnInit{
  lists: any;
  tasks: any;
  selectedListId!: string;
constructor(private taskService: TaskService, private route: ActivatedRoute,private router: Router){}
ngOnInit() {
  this.route.params.subscribe(
    (params: Params) => {
      if (params['listId']) {
        this.selectedListId = params['listId'];
        this.taskService.getTasks(params['listId']).subscribe((tasks: any) => {
          this.tasks = tasks;
        })
      } else {
        this.tasks = undefined;
      }
    }
  )

  this.taskService.getLists().subscribe((lists: any)=>{
     this.lists = lists;
  })
}
onTaskClick(task: Task){
   this.taskService.complete(task).subscribe(()=>{
    console.log("Completed Successfully")
    task.completed = true
   })
}
onDeleteListClick(){
  this.taskService.deleteList(this.selectedListId).subscribe((res:any)=>{
    this.router.navigate(['/lists'])
  })
}
onDeleteTaskClick(id:string){
  this.taskService.deleteTask(this.selectedListId,id).subscribe((res:any)=>{
    this.router.navigate(['/lists'])
  })
}

}
