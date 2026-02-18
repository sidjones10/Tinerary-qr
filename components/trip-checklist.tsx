"use client"

import type React from "react"
import { useState } from "react"
import { Briefcase, Trash2, Plus, LinkIcon, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Task {
  id: string
  name: string
  category: string
  completed: boolean
  url?: string
}

interface TripChecklistProps {
  initialTasks?: Task[]
}

const TripChecklist: React.FC<TripChecklistProps> = ({ initialTasks = [] }) => {
  const [newTaskName, setNewTaskName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("essentials")
  const [newTaskUrl, setNewTaskUrl] = useState("")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [tasks, setTasks] = useState<Task[]>(
    initialTasks.length > 0
      ? initialTasks
      : [
          { id: "1", name: "Passport", category: "essentials", completed: true },
          { id: "2", name: "Travel Insurance", category: "essentials", completed: false },
          {
            id: "3",
            name: "Medication",
            category: "essentials",
            completed: false,
            url: "https://example.com/medication",
          },
          { id: "4", name: "Check-in online", category: "before-departure", completed: true },
          { id: "5", name: "Arrange transportation", category: "before-departure", completed: false },
        ],
  )

  const categories = [
    { id: "essentials", name: "Essentials", icon: "🔑" },
    { id: "before-departure", name: "Before Departure", icon: "✈️" },
    { id: "on-arrival", name: "On Arrival", icon: "🏨" },
    { id: "activities", name: "Activities", icon: "🏄‍♂️" },
  ]

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      setTasks([
        ...tasks,
        {
          id: Date.now().toString(),
          name: newTaskName,
          category: selectedCategory,
          completed: false,
          url: newTaskUrl.trim() ? newTaskUrl : undefined,
        },
      ])
      setNewTaskName("")
      setNewTaskUrl("")
    }
  }

  const toggleTaskCompleted = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const startEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const saveEditTask = () => {
    if (editingTask) {
      setTasks(tasks.map((task) => (task.id === editingTask.id ? editingTask : task)))
      setEditingTask(null)
    }
  }

  const completedCount = tasks.filter((task) => task.completed).length
  const totalCount = tasks.length
  const progressPercentage = Math.round((completedCount / totalCount) * 100) || 0

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center text-xl font-semibold">
          <Briefcase className="mr-2 h-5 w-5 text-blue-500" />
          Trip Checklist
        </CardTitle>
        <p className="text-sm text-muted-foreground">Keep track of everything you need to do for your trip</p>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">
              {completedCount}/{totalCount} tasks completed
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-card rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-indigo-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full bg-blue-500 hover:bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task to Checklist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-name">Task Name</Label>
                <Input
                  id="task-name"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="e.g., Book hotel, Check visa requirements"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-category">Category</Label>
                <select
                  id="task-category"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-url">Related Link (optional)</Label>
                <div className="flex items-center border rounded-md">
                  <LinkIcon className="ml-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="task-url"
                    value={newTaskUrl}
                    onChange={(e) => setNewTaskUrl(e.target.value)}
                    placeholder="https://example.com/booking"
                    className="border-0"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Add a link to a booking confirmation, website, etc.</p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  onClick={handleAddTask}
                  disabled={!newTaskName.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Add to Checklist
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Task Dialog */}
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            {editingTask && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-task-name">Task Name</Label>
                  <Input
                    id="edit-task-name"
                    value={editingTask.name}
                    onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-task-category">Category</Label>
                  <select
                    id="edit-task-category"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editingTask.category}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-task-url">Related Link (optional)</Label>
                  <div className="flex items-center border rounded-md">
                    <LinkIcon className="ml-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-task-url"
                      value={editingTask.url || ""}
                      onChange={(e) => setEditingTask({ ...editingTask, url: e.target.value || undefined })}
                      placeholder="https://example.com/booking"
                      className="border-0"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditTask} className="bg-blue-500 hover:bg-blue-600">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="all-tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="all-tasks" className="mt-4">
            {categories.map((category) => {
              const categoryTasks = tasks.filter((task) => task.category === category.id)
              if (categoryTasks.length === 0) return null

              return (
                <div key={category.id} className="mb-4">
                  <Badge className="mb-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {category.icon} {category.name}
                  </Badge>

                  <div className="space-y-2">
                    {categoryTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center flex-1">
                          <div className="mr-2">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTaskCompleted(task.id)}
                              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className={task.completed ? "line-through text-gray-400" : ""}>{task.name}</span>
                            {task.url && (
                              <a
                                href={task.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                View link
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditTask(task)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 mr-1"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(task.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {categories.map((category) => {
              const categoryTasks = tasks.filter((task) => task.category === category.id && task.completed)
              if (categoryTasks.length === 0) return null

              return (
                <div key={category.id} className="mb-4">
                  <Badge className="mb-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {category.icon} {category.name}
                  </Badge>

                  <div className="space-y-2">
                    {categoryTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center flex-1">
                          <div className="mr-2">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTaskCompleted(task.id)}
                              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="line-through text-gray-400">{task.name}</span>
                            {task.url && (
                              <a
                                href={task.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                View link
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditTask(task)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 mr-1"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(task.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            {categories.map((category) => {
              const categoryTasks = tasks.filter((task) => task.category === category.id && !task.completed)
              if (categoryTasks.length === 0) return null

              return (
                <div key={category.id} className="mb-4">
                  <Badge className="mb-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {category.icon} {category.name}
                  </Badge>

                  <div className="space-y-2">
                    {categoryTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center flex-1">
                          <div className="mr-2">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTaskCompleted(task.id)}
                              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span>{task.name}</span>
                            {task.url && (
                              <a
                                href={task.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                View link
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditTask(task)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 mr-1"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(task.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default TripChecklist
