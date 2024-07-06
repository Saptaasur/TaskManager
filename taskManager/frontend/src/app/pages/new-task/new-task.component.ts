import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../task.service';
import { ActivatedRoute, Params } from '@angular/router';
import { Task } from '../../models/task.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-task',
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.scss']
})
export class NewTaskComponent implements OnInit {
  listId!: string;

  constructor(private taskService: TaskService, private route: ActivatedRoute,  private router: Router) {}

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.listId = params['listId'];
    });
  }

  createTask(title: string) {
    this.taskService.createTask(title, this.listId).subscribe((newTask: any) => {
      this.router.navigate(['../'], { relativeTo: this.route });
    });
  }
}

